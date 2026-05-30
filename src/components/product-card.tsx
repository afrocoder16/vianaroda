import Link from "next/link";
import type { Category, Product, ProductImage } from "@prisma/client";
import { addToCartAction } from "@/lib/actions";
import { formatPrice } from "@/lib/commerce";
import { getCategoryCopy } from "@/lib/brand";
import { ProductImageFrame } from "@/components/product-image-frame";

type Props = {
  product: Product & {
    images: ProductImage[];
    category?: Category;
  };
};

export function ProductCard({ product }: Props) {
  const image = product.images[0]?.path ?? "/globe.svg";
  const savings = product.compareAtPrice
    ? Number(product.compareAtPrice) - Number(product.price)
    : 0;
  const categoryMeta = getCategoryCopy(
    product.category?.slug ?? "",
    product.category?.name ?? "Marketplace",
  );

  return (
    <article className="section-shell group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(83,74,183,0.14)]">
      <Link href={`/product/${product.slug}`}>
        <div className="relative h-72 w-full overflow-hidden bg-[#f3f1ff]">
          <ProductImageFrame
            src={image}
            alt={product.title}
            title={product.title}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#231f4f]/40 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--brand)]">
              {categoryMeta.label}
            </span>
            {product.fastShippingEligible ? (
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                Fast delivery
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f68b6]">
            Great price. Great find.
          </p>
          <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-[-0.03em]">
            {product.title}
          </h3>
        </div>
        <p className="line-clamp-2 text-sm text-[#5f5b74]">
          {categoryMeta.description}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-black tracking-[-0.03em] text-[var(--brand)]">
            {formatPrice(Number(product.price))}
          </span>
          {product.compareAtPrice ? (
            <span className="text-sm text-[#8b88a6] line-through">
              {formatPrice(Number(product.compareAtPrice))}
            </span>
          ) : null}
          {savings > 0 ? (
            <span className="rounded-full bg-[#e7fbf4] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
              Save {formatPrice(savings)}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#faf8ff] p-3 text-sm text-[#5f5b74]">
          <span>
            {Number(product.averageRating).toFixed(1)} / 5 ({product.reviewCount})
          </span>
          <span>{product.shippingLabel}</span>
        </div>
        <div className="mt-auto flex gap-2 pt-1">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 rounded-full border border-[#d9d4ff] px-3 py-2 text-center text-sm font-semibold"
          >
            View details
          </Link>
          <form action={addToCartAction} className="flex-1">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value={1} />
            <button
              disabled={product.stock <= 0}
              className="w-full rounded-full bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Quick add
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
