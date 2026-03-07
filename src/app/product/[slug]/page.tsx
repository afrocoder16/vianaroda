import Image from "next/image";
import { notFound } from "next/navigation";
import { addToCartAction, toggleWishlistAction } from "@/lib/actions";
import { formatPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  const image = product.images[0]?.path ?? "/globe.svg";

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section className="section-shell relative min-h-96 overflow-hidden bg-[#f8f2ea]">
        <Image src={image} alt={product.title} fill className="object-cover" />
      </section>

      <section className="space-y-5">
        <p className="text-xs uppercase tracking-wider text-[#8d6a4e]">
          {product.category.name}
        </p>
        <h1 className="font-serif text-4xl font-black">{product.title}</h1>
        <div className="flex items-end gap-3">
          <p className="text-3xl font-black text-[var(--brand)]">
            {formatPrice(Number(product.price))}
          </p>
          {product.compareAtPrice ? (
            <p className="text-xl text-[#86725c] line-through">
              {formatPrice(Number(product.compareAtPrice))}
            </p>
          ) : null}
        </div>
        <p className="text-[#4f3d2c]">{product.description}</p>
        <p className="text-sm">
          Stock:{" "}
          <span className={product.stock > 0 ? "text-emerald-700" : "text-red-700"}>
            {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
          </span>
        </p>
        <div className="flex gap-3">
          <form action={addToCartAction} className="flex items-center gap-2">
            <input type="hidden" name="productId" value={product.id} />
            <input
              type="number"
              name="quantity"
              min={1}
              max={Math.max(product.stock, 1)}
              defaultValue={1}
              className="w-20 rounded-md border px-2 py-3"
            />
            <button
              disabled={product.stock === 0}
              className="rounded-md bg-[var(--brand)] px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              Add to cart
            </button>
          </form>
          <form action={toggleWishlistAction}>
            <input type="hidden" name="productId" value={product.id} />
            <button className="rounded-md border px-6 py-3 font-semibold">
              Wishlist
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
