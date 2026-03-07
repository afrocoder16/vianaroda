import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { toggleWishlistAction } from "@/lib/actions";
import { formatPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin");
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { images: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold">Wishlist</h1>
      {items.length === 0 ? (
        <div className="section-shell p-8 text-center">
          <p>Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="section-shell p-3">
              <div className="grid grid-cols-[100px_1fr] gap-3">
                <div className="relative h-24 overflow-hidden rounded-md bg-[#f8f2ea]">
                  <Image
                    src={item.product.images[0]?.path ?? "/globe.svg"}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="font-semibold hover:underline"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-sm">{formatPrice(Number(item.product.price))}</p>
                  <form action={toggleWishlistAction}>
                    <input type="hidden" name="productId" value={item.productId} />
                    <button className="text-xs text-[var(--brand)]">Remove</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
