import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getCartSummary, updateCartItemAction } from "@/lib/actions";
import { formatPrice } from "@/lib/commerce";
import { authOptions } from "@/lib/auth";

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="section-shell p-10 text-center">
        <h1 className="font-serif text-3xl font-bold">Sign in to view your cart</h1>
        <Link
          href="/signin"
          className="mt-4 inline-block rounded-md bg-[var(--brand)] px-5 py-2 text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const { cart, totals } = await getCartSummary(session.user.id);
  const items = cart?.items ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        <h1 className="font-serif text-3xl font-bold">Your Cart</h1>
        {items.length === 0 ? (
          <div className="section-shell p-10 text-center">
            <p>Your cart is empty.</p>
            <Link href="/shop" className="mt-3 inline-block text-[var(--brand)]">
              Continue shopping
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="section-shell grid gap-3 p-4 sm:grid-cols-[100px_1fr_auto]"
            >
              <div className="relative h-24 w-24 overflow-hidden rounded-md bg-[#f8f2ea]">
                <Image
                  src={item.product.images[0]?.path ?? "/globe.svg"}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="font-semibold">{item.product.title}</h2>
                <p className="text-sm text-[#6d5943]">
                  {formatPrice(Number(item.unitPrice))}
                </p>
              </div>
              <form action={updateCartItemAction} className="flex items-center gap-2">
                <input type="hidden" name="itemId" value={item.id} />
                <input
                  type="number"
                  min={0}
                  defaultValue={item.quantity}
                  name="quantity"
                  className="w-16 rounded-md border px-2 py-1"
                />
                <button className="rounded-md border px-3 py-1 text-sm">Update</button>
              </form>
              <form action={updateCartItemAction}>
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="quantity" value={0} />
                <button className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700">
                  Remove
                </button>
              </form>
            </article>
          ))
        )}
      </section>

      <aside className="section-shell h-fit space-y-3 p-4">
        <h2 className="font-serif text-xl font-bold">Summary</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPrice(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>{formatPrice(totals.tax)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{formatPrice(totals.shipping)}</span>
        </div>
        <div className="flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span>{formatPrice(totals.total)}</span>
        </div>
        {items.length > 0 ? (
          <Link
            href="/checkout"
            className="block rounded-md bg-[var(--brand)] px-4 py-2 text-center font-semibold text-white"
          >
            Continue to Checkout
          </Link>
        ) : null}
      </aside>
    </div>
  );
}
