import bcrypt from "bcryptjs";
import { PaymentMethod, PrismaClient, Role } from "@prisma/client";
import { deriveRetailPrice, getShippingLabel } from "../src/lib/commerce";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("customer123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@vinaroda.com" },
    update: {},
    create: {
      name: "Vinaroda Admin",
      email: "admin@vinaroda.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@vinaroda.com" },
    update: {},
    create: {
      name: "Sample Customer",
      email: "customer@vinaroda.com",
      passwordHash: userPassword,
      role: Role.CUSTOMER,
    },
  });

  await prisma.address.upsert({
    where: { id: "seed-home-address" },
    update: {},
    create: {
      id: "seed-home-address",
      userId: customer.id,
      label: "Home",
      phone: "3125550101",
      line1: "123 Market Street",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      country: "US",
    },
  });

  await prisma.savedPaymentMethod.upsert({
    where: { id: "seed-payment-card" },
    update: {},
    create: {
      id: "seed-payment-card",
      userId: customer.id,
      provider: PaymentMethod.STRIPE_CARD,
      label: "Personal Visa",
      last4: "4242",
      isDefault: true,
    },
  });

  const categoryNames = ["Women", "Men", "Home", "Beauty", "Electronics"];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categories.push(category);
  }

  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { slug: "aurora-fashion" },
      update: {},
      create: {
        name: "Aurora Fashion",
        slug: "aurora-fashion",
        contactEmail: "ops@aurorafashion.example",
        contactPhone: "800-555-2001",
        leadTimeMin: 5,
        leadTimeMax: 8,
        shippingWindow: getShippingLabel(5, 8),
        notes: "Primary apparel supplier",
      },
    }),
    prisma.supplier.upsert({
      where: { slug: "blue-harbor-home" },
      update: {},
      create: {
        name: "Blue Harbor Home",
        slug: "blue-harbor-home",
        contactEmail: "ops@blueharbor.example",
        contactPhone: "800-555-2002",
        leadTimeMin: 4,
        leadTimeMax: 7,
        shippingWindow: getShippingLabel(4, 7),
        notes: "Home and decor",
      },
    }),
    prisma.supplier.upsert({
      where: { slug: "northstar-electronics" },
      update: {},
      create: {
        name: "Northstar Electronics",
        slug: "northstar-electronics",
        contactEmail: "ops@northstar.example",
        contactPhone: "800-555-2003",
        leadTimeMin: 3,
        leadTimeMax: 6,
        shippingWindow: getShippingLabel(3, 6),
        notes: "Fast electronics fulfillment",
      },
    }),
  ]);

  const productSeed = [
    {
      title: "Signature Linen Blazer",
      description:
        "Tailored lightweight blazer with premium breathable linen blend.",
      supplierCost: 78,
      compareAtPrice: 179,
      sku: "VIN-WM-001",
      supplierSku: "AUR-BLZR-001",
      stock: 44,
      categorySlug: "women",
      supplierSlug: "aurora-fashion",
      image: "/uploads/sample-fashion-1.svg",
      averageRating: 4.8,
      reviewCount: 126,
      unitsSold: 230,
      shippingLeadMin: 5,
      shippingLeadMax: 8,
      fastShippingEligible: false,
      isBestSeller: true,
      isTrending: true,
      variantSummary: "Ivory / S, Ivory / M, Camel / M",
    },
    {
      title: "Urban Motion Sneakers",
      description: "Cushioned everyday sneakers for all-day city comfort.",
      supplierCost: 58,
      compareAtPrice: 120,
      sku: "VIN-MN-002",
      supplierSku: "AUR-SNK-002",
      stock: 58,
      categorySlug: "men",
      supplierSlug: "aurora-fashion",
      image: "/uploads/sample-fashion-2.svg",
      averageRating: 4.6,
      reviewCount: 98,
      unitsSold: 190,
      shippingLeadMin: 4,
      shippingLeadMax: 7,
      fastShippingEligible: true,
      isBestSeller: true,
      isTrending: true,
      variantSummary: "Black 9, Black 10, White 10",
    },
    {
      title: "Marble Glow Table Lamp",
      description: "Soft ambient lamp for modern living spaces.",
      supplierCost: 43,
      compareAtPrice: 99,
      sku: "VIN-HM-003",
      supplierSku: "BLU-LMP-003",
      stock: 28,
      categorySlug: "home",
      supplierSlug: "blue-harbor-home",
      image: "/uploads/sample-home-1.svg",
      averageRating: 4.7,
      reviewCount: 74,
      unitsSold: 110,
      shippingLeadMin: 4,
      shippingLeadMax: 7,
      fastShippingEligible: true,
      isBestSeller: false,
      isTrending: true,
      variantSummary: "Marble base, Brass base",
    },
    {
      title: "Silk Touch Hydration Serum",
      description: "Daily hydration serum with botanical calming blend.",
      supplierCost: 22,
      compareAtPrice: 58,
      sku: "VIN-BT-004",
      supplierSku: "BLU-SRM-004",
      stock: 70,
      categorySlug: "beauty",
      supplierSlug: "blue-harbor-home",
      image: "/uploads/sample-beauty-1.svg",
      averageRating: 4.9,
      reviewCount: 164,
      unitsSold: 260,
      shippingLeadMin: 5,
      shippingLeadMax: 9,
      fastShippingEligible: false,
      isBestSeller: true,
      isTrending: true,
      variantSummary: "30ml, 60ml",
    },
    {
      title: "NovaSound Wireless Earbuds",
      description: "Noise-balanced earbuds with immersive audio profile.",
      supplierCost: 94,
      compareAtPrice: 199,
      sku: "VIN-EL-005",
      supplierSku: "NOR-EBD-005",
      stock: 32,
      categorySlug: "electronics",
      supplierSlug: "northstar-electronics",
      image: "/uploads/sample-tech-1.svg",
      averageRating: 4.5,
      reviewCount: 89,
      unitsSold: 140,
      shippingLeadMin: 3,
      shippingLeadMax: 6,
      fastShippingEligible: true,
      isBestSeller: true,
      isTrending: false,
      variantSummary: "Black, Silver",
    },
  ];

  for (const seed of productSeed) {
    const category = categories.find((item) => item.slug === seed.categorySlug);
    const supplier = suppliers.find((item) => item.slug === seed.supplierSlug);
    if (!category || !supplier) {
      continue;
    }

    const markupPercent = 55;
    await prisma.product.upsert({
      where: { sku: seed.sku },
      update: {},
      create: {
        title: seed.title,
        slug: `${slugify(seed.title)}-${seed.sku.toLowerCase()}`,
        description: seed.description,
        sku: seed.sku,
        supplierSku: seed.supplierSku,
        supplierCost: seed.supplierCost,
        markupPercent,
        price: deriveRetailPrice(seed.supplierCost, markupPercent),
        compareAtPrice: seed.compareAtPrice,
        stock: seed.stock,
        averageRating: seed.averageRating,
        reviewCount: seed.reviewCount,
        unitsSold: seed.unitsSold,
        shippingLeadMin: seed.shippingLeadMin,
        shippingLeadMax: seed.shippingLeadMax,
        shippingLabel: getShippingLabel(seed.shippingLeadMin, seed.shippingLeadMax),
        fastShippingEligible: seed.fastShippingEligible,
        isBestSeller: seed.isBestSeller,
        isTrending: seed.isTrending,
        variantSummary: seed.variantSummary,
        categoryId: category.id,
        supplierId: supplier.id,
        images: {
          create: [{ path: seed.image, alt: seed.title, sortOrder: 0 }],
        },
      },
    });
  }

  const products = await prisma.product.findMany();
  const reviewSeed = [
    {
      sku: "VIN-WM-001",
      author: "Lina R.",
      rating: 5,
      title: "Premium feel without the premium wait",
      body: "The fit was sharp and the delivery window was accurate.",
    },
    {
      sku: "VIN-MN-002",
      author: "Marcus P.",
      rating: 4,
      title: "Comfortable out of the box",
      body: "Good cushioning and the fast shipping badge matched the actual pace.",
    },
    {
      sku: "VIN-EL-005",
      author: "Tessa W.",
      rating: 5,
      title: "Strong audio for the price",
      body: "Easy checkout and tracking updates showed up exactly when expected.",
    },
  ];

  for (const review of reviewSeed) {
    const product = products.find((item) => item.sku === review.sku);
    if (!product) {
      continue;
    }

    const exists = await prisma.review.findFirst({
      where: {
        productId: product.id,
        author: review.author,
        title: review.title,
      },
    });

    if (!exists) {
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: customer.id,
          author: review.author,
          rating: review.rating,
          title: review.title,
          body: review.body,
        },
      });
    }
  }

  void admin;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
