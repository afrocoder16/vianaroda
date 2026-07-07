import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { DatabaseUnavailablePanel } from "@/components/database-unavailable-panel";
import { brand, getCategoryCopy } from "@/lib/brand";
import { formatPrice } from "@/lib/commerce";
import { isDatabaseConnectionError } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { ProductImageFrame } from "@/components/product-image-frame";

export default async function HomePage() {
  let categories;
  let bestSellers;
  let trendingProducts;
  let newArrivals;
  let flashDeals;
  let underTwentyFive;

  try {
    [
      categories,
      bestSellers,
      trendingProducts,
      newArrivals,
      flashDeals,
      underTwentyFive,
    ] = await Promise.all([
      prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { images: true, category: true },
        orderBy: [{ isBestSeller: "desc" }, { unitsSold: "desc" }],
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { images: true, category: true },
        orderBy: [{ isTrending: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { images: true, category: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.product.findMany({
        where: { isActive: true, compareAtPrice: { not: null } },
        include: { images: true, category: true },
        orderBy: [{ fastShippingEligible: "desc" }, { createdAt: "desc" }],
        take: 4,
      }),
      prisma.product.findMany({
        where: { isActive: true, price: { lte: 25 } },
        include: { images: true, category: true },
        orderBy: [{ createdAt: "desc" }],
        take: 4,
      }),
    ]);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return (
        <DatabaseUnavailablePanel description="The homepage could not load because PostgreSQL is not reachable at localhost:5432." />
      );
    }

    throw error;
  }

  const spotlightProduct = bestSellers[0];

  return (
    <div className="page-shell space-y-10">
      <section className="brand-gradient purple-grid overflow-hidden rounded-[2rem] border border-[#d9d4ff] p-8 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand)]">
              {brand.subTagline}
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight tracking-[-0.05em] md:text-7xl">
              {brand.heroHeadline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-[#5f5b74]">
              {brand.heroSubhead}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white"
              >
                Shop Now
              </Link>
              <Link
                href="/shop"
                className="rounded-full border border-[#d9d4ff] bg-white px-6 py-3 font-semibold text-[var(--brand)]"
              >
                Explore Categories
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.75rem] bg-[#231f4f] p-6 text-white soft-ring">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c7c2ff]">
                Find it. Love it. Get it.
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
                Everything you want. One place to get it.
              </h2>
              <p className="mt-3 text-sm text-[#ddd9ff]">
                Great products. Honest prices. Fast shipping. Built so customers
                can find something good in two clicks and buy in under thirty
                seconds.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {newArrivals.slice(0, 2).map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="section-shell p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                    Fresh finds. Just landed.
                  </p>
                  <p className="mt-2 line-clamp-2 text-lg font-bold">
                    {product.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {brand.trustItems.map((item) => (
          <article key={item.title} className="section-shell p-4">
            <p className="text-sm font-bold text-[var(--brand)]">{item.title}</p>
            <p className="mt-1 text-sm text-[#5f5b74]">{item.body}</p>
          </article>
        ))}
      </section>

      {spotlightProduct ? (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Link
            href={`/product/${spotlightProduct.slug}`}
            className="section-shell group overflow-hidden p-0"
          >
            <div className="grid min-h-[30rem] gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative overflow-hidden bg-[#efeaff]">
                <ProductImageFrame
                  src={spotlightProduct.images[0]?.path ?? ""}
                  alt={spotlightProduct.title}
                  title={spotlightProduct.title}
                  className="object-cover transition duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#231f4f]/10 via-transparent to-transparent" />
              </div>
              <div className="flex flex-col justify-between bg-[#231f4f] p-8 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c9c5f5]">
                    Editor&apos;s Spotlight
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    {spotlightProduct.title}
                  </h2>
                  <p className="mt-4 max-w-lg text-base text-[#e4e1ff]">
                    {spotlightProduct.description}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <span className="text-4xl font-black tracking-[-0.04em]">
                      {formatPrice(Number(spotlightProduct.price))}
                    </span>
                    {spotlightProduct.compareAtPrice ? (
                      <span className="text-lg text-[#bdb8ef] line-through">
                        {formatPrice(Number(spotlightProduct.compareAtPrice))}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                      {spotlightProduct.shippingLabel}
                    </span>
                    <span className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
                      {Number(spotlightProduct.averageRating).toFixed(1)} / 5 rating
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <div className="grid gap-6">
            <article className="section-shell brand-gradient p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                Why shoppers come back
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                We didn&apos;t build a store. We built a reason to come back.
              </h3>
              <p className="mt-3 text-sm text-[#5f5b74]">
                Discovery, simplicity, trust, and prices that make sense.
              </p>
            </article>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
              <article className="section-shell p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  New Arrivals
                </p>
                <div className="mt-4 space-y-4">
                  {newArrivals.slice(0, 3).map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      className="block rounded-2xl border border-[#e8e4ff] p-4 transition hover:bg-[#faf9ff]"
                    >
                      <p className="font-semibold">{product.title}</p>
                      <p className="mt-1 text-sm text-[#5f5b74]">
                        {product.shippingLabel}
                      </p>
                    </Link>
                  ))}
                </div>
              </article>

              <article className="section-shell p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                      Under $25
                    </p>
                    <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                      Great doesn&apos;t have to cost much.
                    </h3>
                  </div>
                  <Link
                    href="/shop?max=25"
                    className="text-sm font-semibold text-[var(--accent)]"
                  >
                    Shop budget finds
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">
              What are you looking for today?
            </p>
            <h2 className="text-3xl font-black tracking-[-0.04em]">Categories</h2>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-[var(--brand)]">
            Browse all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const meta = getCategoryCopy(category.slug, category.name);
            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="section-shell group flex min-h-44 flex-col justify-between p-5 transition hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#efedff] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                    {category._count.products} products
                  </span>
                  <span className="text-sm font-semibold text-[#827cb3]">
                    {meta.label}
                  </span>
                </div>
                <div>
                  <h3 className="mt-6 text-2xl font-black tracking-[-0.03em]">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#5f5b74]">{meta.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em]">Best Sellers</h2>
            <p className="text-sm text-[#5f5b74]">
              The ones everyone keeps adding to cart.
            </p>
          </div>
          <Link
            href="/shop?sort=best-selling"
            className="text-sm font-semibold text-[var(--brand)]"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em]">Trending Now</h2>
              <p className="text-sm text-[#5f5b74]">
                What people are obsessing over this week.
              </p>
            </div>
            <Link
              href="/shop?sort=newest"
              className="text-sm font-semibold text-[var(--brand)]"
            >
              See more
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {trendingProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="section-shell overflow-hidden p-0">
            <div className="bg-[var(--brand)] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d7d3ff]">
                Flash Deals
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                Great prices. Limited time. Move fast.
              </h2>
            </div>
            <div className="grid gap-4 p-5">
              {flashDeals.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="rounded-2xl border border-[#e8e4ff] p-4 transition hover:bg-[#faf9ff]"
                >
                  <p className="font-semibold">{product.title}</p>
                  <p className="mt-1 text-sm text-[#5f5b74]">
                    {product.shippingLabel}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="section-shell p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">Under $25</h2>
                <p className="text-sm text-[#5f5b74]">
                  Proof that great doesn&apos;t have to cost much.
                </p>
              </div>
              <Link href="/shop?max=25" className="text-sm font-semibold text-[var(--accent)]">
                Shop budget finds
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {underTwentyFive.length > 0 ? (
                underTwentyFive.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p className="text-sm text-[#5f5b74]">
                  Budget picks will show up here as more products are added.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
