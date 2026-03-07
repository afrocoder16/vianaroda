import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-10">
      <section className="brand-gradient section-shell p-8 md:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8a5636]">
          New season arrivals
        </p>
        <h1 className="mt-4 max-w-2xl font-serif text-4xl font-black leading-tight md:text-6xl">
          Discover everyday luxuries at Vinaroda.
        </h1>
        <p className="mt-4 max-w-xl text-[#5d4630]">
          Shop curated fashion, home, and lifestyle essentials with premium
          presentation and smart discovery.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/shop"
            className="rounded-md bg-[var(--brand)] px-5 py-3 font-semibold text-white hover:bg-[var(--brand-dark)]"
          >
            Explore Collection
          </Link>
          <Link href="/signup" className="rounded-md border px-5 py-3 font-semibold">
            Join Vinaroda
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-2xl font-bold">Shop by Category</h2>
          <Link href="/shop" className="text-sm font-semibold text-[var(--brand)]">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="section-shell flex flex-col gap-2 p-4 transition hover:-translate-y-0.5"
            >
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-sm text-[#6e5841]">
                {category._count.products} products
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold">Featured Products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
