import Image from "next/image";
import Link from "next/link";
import type { Product, ProductImage } from "@prisma/client";
import { formatPrice } from "@/lib/commerce";

type Props = {
  product: Product & {
    images: ProductImage[];
  };
};

export function ProductCard({ product }: Props) {
  const image = product.images[0]?.path ?? "/globe.svg";

  return (
    <article className="section-shell overflow-hidden">
      <Link href={`/product/${product.slug}`}>
        <div className="relative h-56 w-full overflow-hidden bg-[#f8f2ea]">
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover transition duration-300 hover:scale-105"
          />
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-wider text-[#886849]">Featured</p>
        <h3 className="line-clamp-2 text-lg font-bold">{product.title}</h3>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--brand)]">
            {formatPrice(Number(product.price))}
          </span>
          {product.compareAtPrice ? (
            <span className="text-sm text-[#8c7b66] line-through">
              {formatPrice(Number(product.compareAtPrice))}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
