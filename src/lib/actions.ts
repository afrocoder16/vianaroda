"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import {
  OrderStatus,
  PaymentMethod,
  Role,
  SupplierOrderStatus,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  calculateOrderTotals,
  canTransitionOrderStatus,
  canTransitionSupplierStatus,
  deriveRetailPrice,
  getShippingLabel,
  roundMoney,
} from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }
  return session;
}

async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== Role.ADMIN) {
    redirect("/");
  }
  return session;
}

function toOptionalNumber(value: FormDataEntryValue | null) {
  if (value === null) {
    return undefined;
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return undefined;
  }

  const parsed = Number(stringValue);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeTrackingUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export async function registerUserAction(formData: FormData) {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  });

  const parsed = schema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const exists = await prisma.user.findUnique({
    where: { email: parsed.email.toLowerCase() },
  });

  if (exists) {
    redirect("/signup?error=EmailExists");
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  redirect("/signin?registered=1");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return;
  }

  await prisma.category.create({
    data: {
      name,
      slug: slugify(name),
    },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
}

export async function createSupplierAction(formData: FormData) {
  await requireAdmin();
  const schema = z.object({
    name: z.string().min(2),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    leadTimeMin: z.coerce.number().min(1).max(30),
    leadTimeMax: z.coerce.number().min(1).max(45),
    notes: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
  });

  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
    contactPhone: String(formData.get("contactPhone") ?? "").trim() || undefined,
    leadTimeMin: formData.get("leadTimeMin"),
    leadTimeMax: formData.get("leadTimeMax"),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
    isActive: formData.get("isActive") ? true : false,
  });

  if (!parsed.success || parsed.data.leadTimeMin > parsed.data.leadTimeMax) {
    redirect("/admin/suppliers?error=invalid-supplier-input");
  }

  await prisma.supplier.create({
    data: {
      name: parsed.data.name,
      slug: `${slugify(parsed.data.name)}-${Date.now().toString().slice(-4)}`,
      contactEmail: parsed.data.contactEmail.toLowerCase(),
      contactPhone: parsed.data.contactPhone,
      leadTimeMin: parsed.data.leadTimeMin,
      leadTimeMax: parsed.data.leadTimeMax,
      shippingWindow: getShippingLabel(
        parsed.data.leadTimeMin,
        parsed.data.leadTimeMax,
      ),
      notes: parsed.data.notes,
      isActive: parsed.data.isActive ?? true,
    },
  });

  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/products");
}

export async function deleteSupplierAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/products");
}

const productInputSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().min(1),
  compareAtPrice: z.coerce.number().optional(),
  sku: z.string().min(3),
  supplierSku: z.string().optional(),
  stock: z.coerce.number().min(0),
  categoryId: z.string().min(1),
  supplierId: z.string().optional(),
  supplierCost: z.coerce.number().min(0).optional(),
  markupPercent: z.coerce.number().min(0).max(500).optional(),
  averageRating: z.coerce.number().min(1).max(5).optional(),
  shippingLeadMin: z.coerce.number().min(1).max(30),
  shippingLeadMax: z.coerce.number().min(1).max(45),
  variantSummary: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isBestSeller: z.coerce.boolean().optional(),
  isTrending: z.coerce.boolean().optional(),
  fastShippingEligible: z.coerce.boolean().optional(),
});

const MAX_PRODUCT_IMAGES = 5;
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PRODUCT_GALLERY_BYTES = 20 * 1024 * 1024;

async function saveImageFromFile(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "")}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const fullPath = path.join(uploadsDir, safeName);
  await writeFile(fullPath, buffer);
  return `/uploads/${safeName}`;
}

function getUploadedFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function saveProductImages(files: File[], alt: string) {
  if (files.length === 0) {
    return [{ path: "/globe.svg", alt, sortOrder: 0 }];
  }

  if (files.length > MAX_PRODUCT_IMAGES) {
    return null;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (
    totalBytes > MAX_PRODUCT_GALLERY_BYTES ||
    files.some((file) => file.size > MAX_PRODUCT_IMAGE_BYTES)
  ) {
    return null;
  }

  const imagePaths = await Promise.all(files.map((file) => saveImageFromFile(file)));
  return imagePaths.map((imagePath, index) => ({
    path: imagePath,
    alt,
    sortOrder: index,
  }));
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const parsed = productInputSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: formData.get("price"),
    compareAtPrice: toOptionalNumber(formData.get("compareAtPrice")),
    sku: String(formData.get("sku") ?? "").trim(),
    supplierSku: String(formData.get("supplierSku") ?? "").trim() || undefined,
    stock: formData.get("stock"),
    categoryId: String(formData.get("categoryId") ?? ""),
    supplierId: String(formData.get("supplierId") ?? "").trim() || undefined,
    supplierCost: toOptionalNumber(formData.get("supplierCost")),
    markupPercent: toOptionalNumber(formData.get("markupPercent")),
    averageRating: toOptionalNumber(formData.get("averageRating")),
    shippingLeadMin: formData.get("shippingLeadMin"),
    shippingLeadMax: formData.get("shippingLeadMax"),
    variantSummary: String(formData.get("variantSummary") ?? "").trim() || undefined,
    isActive: formData.get("isActive") ? true : false,
    isBestSeller: formData.get("isBestSeller") ? true : false,
    isTrending: formData.get("isTrending") ? true : false,
    fastShippingEligible: formData.get("fastShippingEligible") ? true : false,
  });

  if (
    !parsed.success ||
    parsed.data.shippingLeadMin > parsed.data.shippingLeadMax
  ) {
    redirect("/admin/products?error=invalid-product-input");
  }

  const uploadedFiles = getUploadedFiles(formData);
  const images = await saveProductImages(uploadedFiles, parsed.data.title);
  if (!images) {
    redirect("/admin/products?error=invalid-product-input");
  }

  const slug = slugify(parsed.data.title);
  const markupPercent = Math.round(parsed.data.markupPercent ?? 35);
  const retailPrice =
    parsed.data.supplierCost !== undefined
      ? deriveRetailPrice(parsed.data.supplierCost, markupPercent)
      : roundMoney(parsed.data.price);

  await prisma.product.create({
    data: {
      title: parsed.data.title,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      description: parsed.data.description,
      price: retailPrice,
      compareAtPrice: parsed.data.compareAtPrice,
      sku: parsed.data.sku.toUpperCase(),
      supplierSku: parsed.data.supplierSku?.toUpperCase(),
      supplierCost: parsed.data.supplierCost,
      markupPercent,
      stock: parsed.data.stock,
      isActive: parsed.data.isActive ?? true,
      averageRating: parsed.data.averageRating ?? 4.5,
      reviewCount: 0,
      shippingLeadMin: parsed.data.shippingLeadMin,
      shippingLeadMax: parsed.data.shippingLeadMax,
      shippingLabel: getShippingLabel(
        parsed.data.shippingLeadMin,
        parsed.data.shippingLeadMax,
      ),
      fastShippingEligible: parsed.data.fastShippingEligible ?? false,
      isBestSeller: parsed.data.isBestSeller ?? false,
      isTrending: parsed.data.isTrending ?? false,
      variantSummary: parsed.data.variantSummary,
      categoryId: parsed.data.categoryId,
      supplierId: parsed.data.supplierId,
      images: {
        create: images,
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const price = Number(formData.get("price") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);
  const isActive = formData.get("isActive") ? true : false;

  await prisma.product.update({
    where: { id },
    data: {
      price: roundMoney(price),
      stock: Math.max(0, stock),
      isActive,
    },
  });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function updateProductDetailsAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const parsed = productInputSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: formData.get("price"),
    compareAtPrice: toOptionalNumber(formData.get("compareAtPrice")),
    sku: String(formData.get("sku") ?? "").trim(),
    supplierSku: String(formData.get("supplierSku") ?? "").trim() || undefined,
    stock: formData.get("stock"),
    categoryId: String(formData.get("categoryId") ?? ""),
    supplierId: String(formData.get("supplierId") ?? "").trim() || undefined,
    supplierCost: toOptionalNumber(formData.get("supplierCost")),
    markupPercent: toOptionalNumber(formData.get("markupPercent")),
    averageRating: toOptionalNumber(formData.get("averageRating")),
    shippingLeadMin: formData.get("shippingLeadMin"),
    shippingLeadMax: formData.get("shippingLeadMax"),
    variantSummary: String(formData.get("variantSummary") ?? "").trim() || undefined,
    isActive: formData.get("isActive") ? true : false,
    isBestSeller: formData.get("isBestSeller") ? true : false,
    isTrending: formData.get("isTrending") ? true : false,
    fastShippingEligible: formData.get("fastShippingEligible") ? true : false,
  });

  if (
    !parsed.success ||
    parsed.data.shippingLeadMin > parsed.data.shippingLeadMax
  ) {
    redirect(`/admin/products/${id}/edit?error=invalid-product-input`);
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!existing) {
    redirect("/admin/products");
  }

  const uploadedFiles = getUploadedFiles(formData);
  const images =
    uploadedFiles.length > 0
      ? await saveProductImages(uploadedFiles, parsed.data.title)
      : undefined;
  if (uploadedFiles.length > 0 && !images) {
    redirect(`/admin/products/${id}/edit?error=invalid-product-input`);
  }
  const markupPercent = Math.round(parsed.data.markupPercent ?? 35);
  const retailPrice =
    parsed.data.supplierCost !== undefined
      ? deriveRetailPrice(parsed.data.supplierCost, markupPercent)
      : roundMoney(parsed.data.price);

  await prisma.product.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      price: retailPrice,
      compareAtPrice: parsed.data.compareAtPrice,
      sku: parsed.data.sku.toUpperCase(),
      supplierSku: parsed.data.supplierSku?.toUpperCase(),
      supplierCost: parsed.data.supplierCost,
      markupPercent,
      stock: parsed.data.stock,
      averageRating: parsed.data.averageRating ?? Number(existing.averageRating),
      shippingLeadMin: parsed.data.shippingLeadMin,
      shippingLeadMax: parsed.data.shippingLeadMax,
      shippingLabel: getShippingLabel(
        parsed.data.shippingLeadMin,
        parsed.data.shippingLeadMax,
      ),
      fastShippingEligible: parsed.data.fastShippingEligible ?? false,
      isBestSeller: parsed.data.isBestSeller ?? false,
      isTrending: parsed.data.isTrending ?? false,
      variantSummary: parsed.data.variantSummary,
      categoryId: parsed.data.categoryId,
      supplierId: parsed.data.supplierId,
      isActive: parsed.data.isActive ?? true,
    },
  });

  if (images) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productImage.createMany({
      data: images.map((image) => ({
        productId: id,
        path: image.path,
        alt: image.alt,
        sortOrder: image.sortOrder,
      })),
    });
  }

  revalidatePath("/admin/products");
  revalidatePath(`/product/${existing.slug}`);
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function addToCartAction(formData: FormData) {
  const session = await requireSession();
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? "1");
  if (!productId || quantity < 1) {
    return;
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return;
  }

  const cart = await prisma.cart.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
    create: {
      cartId: cart.id,
      productId,
      quantity,
      unitPrice: product.price,
    },
    update: {
      quantity: { increment: quantity },
      unitPrice: product.price,
    },
  });

  revalidatePath("/cart");
}

export async function updateCartItemAction(formData: FormData) {
  const session = await requireSession();
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? "1");

  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: { userId: session.user.id },
    },
  });

  if (!item) {
    return;
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(quantity, 99) },
    });
  }
  revalidatePath("/cart");
}

export async function buyNowAction(formData: FormData) {
  await addToCartAction(formData);
  redirect("/checkout");
}

export async function toggleWishlistAction(formData: FormData) {
  const session = await requireSession();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) {
    return;
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({
      data: { userId: session.user.id, productId },
    });
  }
  revalidatePath("/account/wishlist");
  revalidatePath("/product");
}

export async function saveAddressAction(formData: FormData) {
  const session = await requireSession();
  const schema = z.object({
    label: z.string().optional(),
    phone: z.string().optional(),
    line1: z.string().min(4),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2),
  });

  const parsed = schema.safeParse({
    label: String(formData.get("label") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    line1: String(formData.get("line1") ?? "").trim(),
    line2: String(formData.get("line2") ?? "").trim() || undefined,
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    postalCode: String(formData.get("postalCode") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim(),
  });

  if (!parsed.success) {
    redirect("/account?error=invalid-address");
  }

  await prisma.address.create({
    data: {
      userId: session.user.id,
      label: parsed.data.label,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2,
      city: parsed.data.city,
      state: parsed.data.state,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
    },
  });

  revalidatePath("/account");
  revalidatePath("/checkout");
}

export async function savePaymentMethodAction(formData: FormData) {
  const session = await requireSession();
  const provider = String(formData.get("provider") ?? "") as PaymentMethod;
  const label = String(formData.get("label") ?? "").trim();
  const last4 = String(formData.get("last4") ?? "").trim() || undefined;

  if (!Object.values(PaymentMethod).includes(provider) || label.length < 2) {
    redirect("/account?error=invalid-payment-method");
  }

  const isDefault = formData.get("isDefault") ? true : false;

  await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.savedPaymentMethod.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    await tx.savedPaymentMethod.create({
      data: {
        userId: session.user.id,
        provider,
        label,
        last4,
        isDefault,
      },
    });
  });

  revalidatePath("/account");
}

export async function checkoutAction(formData: FormData) {
  const session = await requireSession();
  const schema = z.object({
    customerName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    line1: z.string().min(4),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2),
    paymentMethod: z.nativeEnum(PaymentMethod),
  });

  const parsed = schema.safeParse({
    customerName: String(formData.get("customerName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    line1: String(formData.get("line1") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    postalCode: String(formData.get("postalCode") ?? "").trim(),
    country: String(formData.get("country") ?? "US").trim(),
    paymentMethod: String(formData.get("paymentMethod") ?? "") as PaymentMethod,
  });

  if (!parsed.success) {
    redirect("/checkout?error=invalid-checkout");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: { include: { supplier: true } } } } },
  });

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const totals = calculateOrderTotals(
    cart.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
  );

  const supplierNames = Array.from(
    new Set(
      cart.items
        .map((item) => item.product.supplier?.name)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const longestLead = cart.items.reduce(
    (acc, item) => Math.max(acc, item.product.shippingLeadMax),
    0,
  );
  const shortestLead = cart.items.reduce(
    (acc, item) => Math.min(acc, item.product.shippingLeadMin),
    Number.POSITIVE_INFINITY,
  );
  const estimatedDelivery =
    Number.isFinite(shortestLead) && longestLead > 0
      ? getShippingLabel(shortestLead, longestLead)
      : "Delivery estimate pending";

  const createdOrder = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: OrderStatus.PAID,
      supplierOrderStatus: SupplierOrderStatus.FORWARDED,
      paymentMethod: parsed.data.paymentMethod,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      customerName: parsed.data.customerName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      address: parsed.data.line1,
      city: parsed.data.city,
      state: parsed.data.state,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
      supplierSummary:
        supplierNames.length > 0 ? supplierNames.join(", ") : "Unassigned supplier",
      supplierReference: `PO-${Date.now().toString().slice(-8)}`,
      fulfillmentNotes:
        "Supplier order forwarded automatically into the manual fulfillment queue.",
      estimatedDelivery,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          titleSnapshot: item.product.title,
          supplierName: item.product.supplier?.name,
          supplierSku: item.product.supplierSku,
          variantSnapshot: item.product.variantSummary,
          shippingLabel: item.product.shippingLabel,
          unitPrice: item.unitPrice,
        })),
      },
    },
  });

  await prisma.$transaction([
    ...cart.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          unitsSold: { increment: item.quantity },
        },
      }),
    ),
    prisma.address.create({
      data: {
        userId: session.user.id,
        label: "Checkout",
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        city: parsed.data.city,
        state: parsed.data.state,
        postalCode: parsed.data.postalCode,
        country: parsed.data.country,
      },
    }),
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
  ]);

  revalidatePath("/account/orders");
  revalidatePath("/account");
  revalidatePath("/admin/orders");
  redirect(`/account/orders?placed=1&order=${createdOrder.id}`);
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!orderId || !Object.values(OrderStatus).includes(status)) {
    return;
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !canTransitionOrderStatus(order.status, status)) {
    return;
  }
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
}

export async function updateOrderFulfillmentAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const supplierOrderStatus = String(
    formData.get("supplierOrderStatus") ?? "",
  ) as SupplierOrderStatus;

  if (
    !orderId ||
    !Object.values(SupplierOrderStatus).includes(supplierOrderStatus)
  ) {
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (
    !order ||
    !canTransitionSupplierStatus(order.supplierOrderStatus, supplierOrderStatus)
  ) {
    return;
  }

  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const trackingUrl = normalizeTrackingUrl(
    String(formData.get("trackingUrl") ?? ""),
  );
  const supplierReference = String(formData.get("supplierReference") ?? "").trim();
  const fulfillmentNotes = String(formData.get("fulfillmentNotes") ?? "").trim();
  const estimatedDelivery = String(formData.get("estimatedDelivery") ?? "").trim();

  await prisma.order.update({
    where: { id: orderId },
    data: {
      supplierOrderStatus,
      trackingNumber: trackingNumber || undefined,
      trackingUrl,
      supplierReference: supplierReference || undefined,
      fulfillmentNotes: fulfillmentNotes || undefined,
      estimatedDelivery: estimatedDelivery || undefined,
      status:
        supplierOrderStatus === SupplierOrderStatus.SHIPPED
          ? OrderStatus.SHIPPED
          : supplierOrderStatus === SupplierOrderStatus.DELIVERED
            ? OrderStatus.DELIVERED
            : supplierOrderStatus === SupplierOrderStatus.REFUNDED
              ? OrderStatus.CANCELLED
              : order.status,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
}

export async function importSupplierProductsAction(formData: FormData) {
  await requireAdmin();
  const supplierId = String(formData.get("supplierId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const payload = String(formData.get("payload") ?? "").trim();

  if (!supplierId || !categoryId || !payload) {
    redirect("/admin/suppliers?error=invalid-import");
  }

  let entries: Array<{
    title: string;
    description: string;
    sku: string;
    supplierSku?: string;
    supplierCost: number;
    markupPercent?: number;
    stock?: number;
    compareAtPrice?: number;
    rating?: number;
    shippingLeadMin?: number;
    shippingLeadMax?: number;
    fastShippingEligible?: boolean;
    isBestSeller?: boolean;
    isTrending?: boolean;
    variantSummary?: string;
    image?: string;
  }>;

  try {
    entries = JSON.parse(payload) as typeof entries;
  } catch {
    redirect("/admin/suppliers?error=invalid-import-json");
  }

  await prisma.product.createMany({
    data: entries.map((entry, index) => {
      const markupPercent = Math.round(entry.markupPercent ?? 35);
      const shippingLeadMin = entry.shippingLeadMin ?? 5;
      const shippingLeadMax = entry.shippingLeadMax ?? 10;
      return {
        title: entry.title,
        slug: `${slugify(entry.title)}-${Date.now().toString().slice(-4)}-${index}`,
        description: entry.description,
        sku: entry.sku.toUpperCase(),
        supplierSku: entry.supplierSku?.toUpperCase(),
        supplierCost: roundMoney(entry.supplierCost),
        markupPercent,
        price: deriveRetailPrice(entry.supplierCost, markupPercent),
        compareAtPrice: entry.compareAtPrice,
        stock: entry.stock ?? 25,
        isActive: true,
        averageRating: entry.rating ?? 4.4,
        reviewCount: 0,
        shippingLeadMin,
        shippingLeadMax,
        shippingLabel: getShippingLabel(shippingLeadMin, shippingLeadMax),
        fastShippingEligible: entry.fastShippingEligible ?? false,
        isBestSeller: entry.isBestSeller ?? false,
        isTrending: entry.isTrending ?? false,
        variantSummary: entry.variantSummary,
        categoryId,
        supplierId,
      };
    }),
    skipDuplicates: true,
  });

  for (const entry of entries) {
    if (!entry.image) {
      continue;
    }

    const product = await prisma.product.findUnique({
      where: { sku: entry.sku.toUpperCase() },
      include: { images: true },
    });

    if (product && product.images.length === 0) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          path: entry.image,
          alt: entry.title,
          sortOrder: 0,
        },
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/suppliers");
  revalidatePath("/shop");
}

export async function uploadImageAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    return "";
  }
  return saveImageFromFile(file);
}

export async function getCartSummary(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: { include: { images: true } } } },
    },
  });
  if (!cart) {
    return {
      cart: null,
      totals: calculateOrderTotals([]),
    };
  }

  const totals = calculateOrderTotals(
    cart.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
  );

  return { cart, totals };
}

export async function getStorefrontProducts(params: {
  query?: string;
  category?: string;
  min?: number;
  max?: number;
  rating?: number;
  shipping?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}) {
  const page = Math.max(params.page ?? 1, 1);
  const perPage = params.perPage ?? 12;
  const where = {
    isActive: true,
    title: params.query
      ? { contains: params.query, mode: "insensitive" as const }
      : undefined,
    category: params.category
      ? { slug: params.category }
      : undefined,
    averageRating:
      params.rating && params.rating > 0 ? { gte: params.rating } : undefined,
    fastShippingEligible:
      params.shipping === "fast" ? true : undefined,
    price: {
      gte: params.min ?? undefined,
      lte: params.max ?? undefined,
    },
  };

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (params.sort === "best-selling") {
    orderBy = { unitsSold: "desc" };
  } else if (params.sort === "price-asc") {
    orderBy = { price: "asc" };
  } else if (params.sort === "price-desc") {
    orderBy = { price: "desc" };
  } else if (params.sort === "newest") {
    orderBy = { createdAt: "desc" };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: true, category: true },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}
