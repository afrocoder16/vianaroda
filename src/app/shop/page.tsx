import Link from "next/link";
import { ProductCard } from "@/components/product-card";
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
  const sort = typeof params.sort === "string" ? params.sort : "latest";
  const page = Number(
    typeof params.page === "string" && Number(params.page) > 0 ? params.page : 1,
  );
  const min = Number(typeof params.min === "string" ? params.min : 0) || 0;
  const max = Number(typeof params.max === "string" ? params.max : 10000) || 10000;

  const [catalog, categories] = await Promise.all([
    getStorefrontProducts({ query: q, category, sort, page, min, max }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <aside className="section-shell h-fit space-y-4 p-4">
        <h2 className="font-serif text-xl font-bold">Find Products</h2>
        <form className="space-y-3">
          <input
            defaultValue={q}
            name="q"
            placeholder="Search title..."
            className="w-full rounded-md border border-[#e3d6c7] bg-white px-3 py-2"
          />
          <select
            defaultValue={category}
            name="category"
            className="w-full rounded-md border border-[#e3d6c7] bg-white px-3 py-2"
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
              placeholder="Min"
              className="rounded-md border border-[#e3d6c7] bg-white px-3 py-2"
            />
            <input
              type="number"
              defaultValue={max}
              name="max"
              placeholder="Max"
              className="rounded-md border border-[#e3d6c7] bg-white px-3 py-2"
            />
          </div>
          <select
            defaultValue={sort}
            name="sort"
            className="w-full rounded-md border border-[#e3d6c7] bg-white px-3 py-2"
          >
            <option value="latest">Latest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
          <button className="w-full rounded-md bg-[var(--brand)] px-4 py-2 font-semibold text-white">
            Apply filters
          </button>
        </form>
      </aside>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-black">Shop</h1>
          <p className="text-sm text-[#6a563f]">
            {catalog.total} result{catalog.total === 1 ? "" : "s"}
          </p>
        </div>

        {catalog.items.length === 0 ? (
          <div className="section-shell p-8 text-center text-[#6e5841]">
            No products matched your filters.
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
                q,
                category,
                sort,
                min: String(min),
                max: String(max),
                page: String(page - 1),
              })}`}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Previous
            </Link>
          ) : null}
          <span className="text-sm text-[#6a563f]">
            Page {catalog.page} of {catalog.pages}
          </span>
          {page < catalog.pages ? (
            <Link
              href={`/shop?${new URLSearchParams({
                q,
                category,
                sort,
                min: String(min),
                max: String(max),
                page: String(page + 1),
              })}`}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Next
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
