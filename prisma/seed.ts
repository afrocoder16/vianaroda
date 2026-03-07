import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("customer123", 10);

  await prisma.user.upsert({
    where: { email: "admin@vinaroda.com" },
    update: {},
    create: {
      name: "Vinaroda Admin",
      email: "admin@vinaroda.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@vinaroda.com" },
    update: {},
    create: {
      name: "Sample Customer",
      email: "customer@vinaroda.com",
      passwordHash: userPassword,
      role: Role.CUSTOMER,
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

  const productSeed = [
    {
      title: "Signature Linen Blazer",
      description:
        "Tailored lightweight blazer with premium breathable linen blend.",
      price: 129,
      compareAtPrice: 179,
      sku: "VIN-WM-001",
      stock: 44,
      categorySlug: "women",
      image: "/uploads/sample-fashion-1.svg",
    },
    {
      title: "Urban Motion Sneakers",
      description: "Cushioned everyday sneakers for all-day city comfort.",
      price: 96,
      compareAtPrice: 120,
      sku: "VIN-MN-002",
      stock: 58,
      categorySlug: "men",
      image: "/uploads/sample-fashion-2.svg",
    },
    {
      title: "Marble Glow Table Lamp",
      description: "Soft ambient lamp for modern living spaces.",
      price: 74,
      compareAtPrice: 99,
      sku: "VIN-HM-003",
      stock: 28,
      categorySlug: "home",
      image: "/uploads/sample-home-1.svg",
    },
    {
      title: "Silk Touch Hydration Serum",
      description: "Daily hydration serum with botanical calming blend.",
      price: 42,
      compareAtPrice: 58,
      sku: "VIN-BT-004",
      stock: 70,
      categorySlug: "beauty",
      image: "/uploads/sample-beauty-1.svg",
    },
    {
      title: "NovaSound Wireless Earbuds",
      description: "Noise-balanced earbuds with immersive audio profile.",
      price: 159,
      compareAtPrice: 199,
      sku: "VIN-EL-005",
      stock: 32,
      categorySlug: "electronics",
      image: "/uploads/sample-tech-1.svg",
    },
  ];

  for (const seed of productSeed) {
    const category = categories.find((item) => item.slug === seed.categorySlug);
    if (!category) {
      continue;
    }

    await prisma.product.upsert({
      where: { sku: seed.sku },
      update: {},
      create: {
        title: seed.title,
        slug: `${slugify(seed.title)}-${seed.sku.toLowerCase()}`,
        description: seed.description,
        sku: seed.sku,
        price: seed.price,
        compareAtPrice: seed.compareAtPrice,
        stock: seed.stock,
        categoryId: category.id,
        images: {
          create: [{ path: seed.image, alt: seed.title, sortOrder: 0 }],
        },
      },
    });
  }
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
