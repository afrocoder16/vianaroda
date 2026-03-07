"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { OrderStatus, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  calculateOrderTotals,
  canTransitionOrderStatus,
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

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    price: z.coerce.number().min(1),
    compareAtPrice: z.coerce.number().optional(),
    sku: z.string().min(3),
    stock: z.coerce.number().min(0),
    categoryId: z.string().min(1),
    isActive: z.coerce.boolean().optional(),
  });

  const parsed = schema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    sku: String(formData.get("sku") ?? "").trim(),
    stock: formData.get("stock"),
    categoryId: String(formData.get("categoryId") ?? ""),
    isActive: formData.get("isActive") ? true : false,
  });

  if (!parsed.success) {
    redirect("/admin/products?error=invalid-product-input");
  }

  const file = formData.get("image") as File | null;
  const imagePath =
    file && file.size > 0 ? await saveImageFromFile(file) : "/globe.svg";

  const slug = slugify(parsed.data.title);

  await prisma.product.create({
    data: {
      title: parsed.data.title,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      description: parsed.data.description,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice,
      sku: parsed.data.sku.toUpperCase(),
      stock: parsed.data.stock,
      isActive: parsed.data.isActive ?? true,
      categoryId: parsed.data.categoryId,
      images: {
        create: [{ path: imagePath, alt: parsed.data.title, sortOrder: 0 }],
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

  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    price: z.coerce.number().min(1),
    compareAtPrice: z.coerce.number().optional(),
    sku: z.string().min(3),
    stock: z.coerce.number().min(0),
    categoryId: z.string().min(1),
    isActive: z.coerce.boolean().optional(),
  });

  const parsed = schema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    sku: String(formData.get("sku") ?? "").trim(),
    stock: formData.get("stock"),
    categoryId: String(formData.get("categoryId") ?? ""),
    isActive: formData.get("isActive") ? true : false,
  });

  if (!parsed.success) {
    redirect(`/admin/products/${id}/edit?error=invalid-product-input`);
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!existing) {
    redirect("/admin/products");
  }

  const file = formData.get("image") as File | null;
  const imagePath =
    file && file.size > 0 ? await saveImageFromFile(file) : undefined;

  await prisma.product.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice,
      sku: parsed.data.sku.toUpperCase(),
      stock: parsed.data.stock,
      categoryId: parsed.data.categoryId,
      isActive: parsed.data.isActive ?? true,
    },
  });

  if (imagePath) {
    if (existing.images.length > 0) {
      await prisma.productImage.update({
        where: { id: existing.images[0].id },
        data: { path: imagePath, alt: parsed.data.title },
      });
    } else {
      await prisma.productImage.create({
        data: {
          productId: id,
          path: imagePath,
          alt: parsed.data.title,
          sortOrder: 0,
        },
      });
    }
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

export async function checkoutAction(formData: FormData) {
  const session = await requireSession();
  const line1 = String(formData.get("line1") ?? "");
  const city = String(formData.get("city") ?? "");
  const state = String(formData.get("state") ?? "");
  const postalCode = String(formData.get("postalCode") ?? "");
  const country = String(formData.get("country") ?? "US");

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: true } } },
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

  await prisma.order.create({
    data: {
      userId: session.user.id,
      status: OrderStatus.PAID,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      address: line1,
      city,
      state,
      postalCode,
      country,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          titleSnapshot: item.product.title,
          unitPrice: item.unitPrice,
        })),
      },
    },
  });

  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidatePath("/account/orders");
  revalidatePath("/admin/orders");
  redirect("/account/orders?placed=1");
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
    price: {
      gte: params.min ?? undefined,
      lte: params.max ?? undefined,
    },
  };

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (params.sort === "price-asc") {
    orderBy = { price: "asc" };
  } else if (params.sort === "price-desc") {
    orderBy = { price: "desc" };
  } else if (params.sort === "name") {
    orderBy = { title: "asc" };
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
