import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { brand } from "@/lib/brand";
import { getStorefrontProducts } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sort = typeof params.sort === "string" ? params.sort : "best-selling";
  const shipping = typeof params.shipping === "string" ? params.shipping : "";
  const rating = Number(typeof params.rating === "string" ? params.rating : "0");
  const page = Number(
    typeof params.page === "string" && Number(params.page) > 0 ? params.page : 1,
  );
  const min = Number(typeof params.min === "string" ? params.min : 0) || 0;
  const max = Number(typeof params.max === "string" ? params.max : 10000) || 10000;

  const [catalog, categories] = await Promise.all([
    getStorefrontProducts({
      query: q,
      category,
      sort,
      page,
      min,
      max,
      rating,
      shipping,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const baseParams = {
    q,
    category,
    sort,
    shipping,
    rating: String(rating || 0),
    min: String(min),
    max: String(max),
  };

  return (
    <div className="space-y-6">
      <section className="brand-gradient rounded-[2rem] border border-[#d9d4ff] p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand)]">
          Shop everything. Love the price.
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-5xl">
          {q ? `Search results for "${q}"` : "Everything you want. One place to get it."}
        </h1>
        <p className="mt-3 max-w-3xl text-[#5f5b74]">
          {catalog.total} result{catalog.total === 1 ? "" : "s"} ready to browse
          across fashion, beauty, home, tech, and more.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="section-shell h-fit space-y-4 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
              Filters
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">
              Find it fast
            </h2>
          </div>

          <form className="space-y-3">
            <input
              defaultValue={q}
              name="q"
              placeholder="Search by title"
              className="w-full rounded-2xl border border-[#d9d4ff] bg-white px-4 py-3"
            />
            <select
              defaultValue={category}
              name="category"
              className="w-full rounded-2xl border border-[#d9d4ff] bg-white px-4 py-3"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                defaultValue={min}
                name="min"
                placeholder="Min price"
                className="rounded-2xl border border-[#d9d4ff] bg-white px-4 py-3"
              />
              <input
                type="number"
                defaultValue={max}
                name="max"
                placeholder="Max price"
                className="rounded-2xl border border-[#d9d4ff] bg-white px-4 py-3"
              />
            </div>
            <select
              defaultValue={rating ? String(rating) : ""}
              name="rating"
              className="w-full rounded-2xl border border-[#d9d4ff] bg-white px-4 py-3"
            >
              <option value="">Any rating</option>
              <option value="4">4 stars & up</option>
              <option value="4.5">4.5 stars & up</option>
            </select>
            <select
              defaultValue={shipping}
              name="shipping"
              className="w-full rounded-2xl border border-[#d9d4ff] bg-white px-4 py-3"
            >
              <option value="">Any shipping speed</option>
              <option value="fast">Fast shipping</option>
            </select>
            <select
              defaultValue={sort}
              name="sort"
              className="w-full rounded-2xl border border-[#d9d4ff] bg-white px-4 py-3"
            >
              <option value="best-selling">Best selling</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
            <button className="w-full rounded-full bg-[var(--brand)] px-4 py-3 font-semibold text-white">
              Apply filters
            </button>
          </form>
        </aside>

        <section className="space-y-4">
          <div className="section-shell flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em]">
                {q ? "Search Results" : "Shop All"}
              </h2>
              <p className="text-sm text-[#5f5b74]">
                {brand.tagline}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {category ? (
                <Link
                  href="/shop"
                  className="rounded-full bg-[#efedff] px-3 py-2 text-[var(--brand)]"
                >
                  Category: {category}
                </Link>
              ) : null}
              {shipping === "fast" ? (
                <Link
                  href="/shop"
                  className="rounded-full bg-[#e7fbf4] px-3 py-2 text-[var(--accent)]"
                >
                  Fast shipping
                </Link>
              ) : null}
              {max <= 25 ? (
                <Link
                  href="/shop"
                  className="rounded-full bg-[#efedff] px-3 py-2 text-[var(--brand)]"
                >
                  Under $25
                </Link>
              ) : null}
            </div>
          </div>

          {catalog.items.length === 0 ? (
            <div className="section-shell p-8 text-center text-[#5f5b74]">
              Nothing matched those filters yet. Try widening your price range or
              switching categories.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {catalog.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link
                href={`/shop?${new URLSearchParams({
                  ...baseParams,
                  page: String(page - 1),
                })}`}
                className="rounded-full border border-[#d9d4ff] px-4 py-2 text-sm"
              >
                Previous
              </Link>
            ) : null}
            <span className="text-sm text-[#5f5b74]">
              Page {catalog.page} of {catalog.pages}
            </span>
            {page < catalog.pages ? (
              <Link
                href={`/shop?${new URLSearchParams({
                  ...baseParams,
                  page: String(page + 1),
                })}`}
                className="rounded-full border border-[#d9d4ff] px-4 py-2 text-sm"
              >
                Next
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
