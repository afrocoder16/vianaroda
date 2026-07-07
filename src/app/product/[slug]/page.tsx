import Link from "next/link";
import { notFound } from "next/navigation";
import { DatabaseUnavailablePanel } from "@/components/database-unavailable-panel";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import {
  addToCartAction,
  buyNowAction,
  toggleWishlistAction,
} from "@/lib/actions";
import { brand, getCategoryCopy } from "@/lib/brand";
import { formatPrice } from "@/lib/commerce";
import { isDatabaseConnectionError } from "@/lib/database";
import { prisma } from "@/lib/prisma";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product;
  let relatedProducts;

  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        supplier: true,
        reviews: {
          orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
          take: 4,
        },
      },
    });

    if (!product || !product.isActive) {
      notFound();
    }

    relatedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      include: { images: true, category: true },
      orderBy: [{ isTrending: "desc" }, { unitsSold: "desc" }],
      take: 4,
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return (
        <DatabaseUnavailablePanel description="Product pages are unavailable until PostgreSQL is reachable and the sample catalog is loaded." />
      );
    }

    throw error;
  }

  const images =
    product.images.length > 0
      ? product.images.slice(0, 5)
      : [
          {
            path: "/globe.svg",
            alt: product.title,
            id: "fallback",
            productId: product.id,
            sortOrder: 0,
            createdAt: new Date(),
          },
        ];
  const variants =
    product.variantSummary
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
  const savings = product.compareAtPrice
    ? Number(product.compareAtPrice) - Number(product.price)
    : 0;
  const categoryMeta = getCategoryCopy(product.category.slug, product.category.name);

  return (
    <div className="space-y-10">
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <ProductGallery images={images} productTitle={product.title} />

        <section className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#efedff] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                {categoryMeta.label}
              </span>
              {product.fastShippingEligible ? (
                <span className="rounded-full bg-[#e7fbf4] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  Fast shipping
                </span>
              ) : null}
            </div>
            <h1 className="text-4xl font-black tracking-[-0.05em] md:text-5xl">
              {product.title}
            </h1>
            <p className="text-sm text-[#5f5b74]">
              {Number(product.averageRating).toFixed(1)} / 5 rating from{" "}
              {product.reviewCount} shoppers
            </p>
          </div>

          <div className="section-shell space-y-4 p-5">
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black tracking-[-0.04em] text-[var(--brand)]">
                {formatPrice(Number(product.price))}
              </p>
              {product.compareAtPrice ? (
                <p className="text-xl text-[#8b88a6] line-through">
                  {formatPrice(Number(product.compareAtPrice))}
                </p>
              ) : null}
              {savings > 0 ? (
                <span className="rounded-full bg-[#e7fbf4] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  Save {formatPrice(savings)}
                </span>
              ) : null}
            </div>

            <p className="text-[#5f5b74]">{product.description}</p>

            {variants.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Available variants</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <span
                      key={variant}
                      className="rounded-full border border-[#d9d4ff] px-3 py-2 text-sm"
                    >
                      {variant}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 rounded-[1.25rem] bg-[#fbfaff] p-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">Shipping</p>
                <p className="text-[#5f5b74]">{product.shippingLabel}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Stock</p>
                <p className={product.stock > 0 ? "text-[var(--accent)]" : "text-red-700"}>
                  {product.stock > 0 ? `${product.stock} ready to order` : "Out of stock"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Support</p>
                <p className="text-[#5f5b74]">Real support if you need help.</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Checkout</p>
                <p className="text-[#5f5b74]">Card, PayPal, Apple Pay, Google Pay</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <form action={addToCartAction} className="flex items-center gap-2">
                <input type="hidden" name="productId" value={product.id} />
                <input
                  type="number"
                  name="quantity"
                  min={1}
                  max={Math.max(product.stock, 1)}
                  defaultValue={1}
                  className="w-20 rounded-full border border-[#d9d4ff] px-3 py-3"
                />
                <button
                  disabled={product.stock === 0}
                  className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white disabled:opacity-50"
                >
                  Add to cart
                </button>
              </form>
              <form action={buyNowAction}>
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="quantity" value={1} />
                <button
                  disabled={product.stock === 0}
                  className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white disabled:opacity-50"
                >
                  Buy now
                </button>
              </form>
              <form action={toggleWishlistAction}>
                <input type="hidden" name="productId" value={product.id} />
                <button className="rounded-full border border-[#d9d4ff] px-6 py-3 font-semibold">
                  Save
                </button>
              </form>
            </div>

            <p className="rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
              Demo store &mdash; checkout places a pending order and collects no payment.
            </p>
          </div>

          <div className="section-shell p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
              {brand.tagline}
            </p>
            <p className="mt-2 text-sm text-[#5f5b74]">
              Orders are routed to the supplier automatically after checkout and
              tracking updates show up in your account as soon as the package moves.
            </p>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em]">
              Customer Reviews
            </h2>
            <p className="text-sm text-[#5f5b74]">Real support. Real reactions.</p>
          </div>
          <Link href="/support" className="text-sm font-semibold text-[var(--brand)]">
            Need help?
          </Link>
        </div>
        {product.reviews.length === 0 ? (
          <div className="section-shell p-5 text-sm text-[#5f5b74]">
            Reviews will show up here as customers start buying this product.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {product.reviews.map((review) => (
              <article key={review.id} className="section-shell space-y-2 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{review.author}</p>
                  <p className="text-sm text-[#5f5b74]">{review.rating} / 5</p>
                </div>
                {review.title ? (
                  <h3 className="text-lg font-bold">{review.title}</h3>
                ) : null}
                <p className="text-sm text-[#5f5b74]">{review.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.04em]">You might also like</h2>
          <p className="text-sm text-[#5f5b74]">Discover something new every day.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard key={relatedProduct.id} product={relatedProduct} />
          ))}
        </div>
      </section>
    </div>
  );
}
