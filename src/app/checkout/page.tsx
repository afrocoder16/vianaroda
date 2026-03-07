import Link from "next/link";
import { getServerSession } from "next-auth";
import { checkoutAction, getCartSummary } from "@/lib/actions";
import { formatPrice } from "@/lib/commerce";
import { authOptions } from "@/lib/auth";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="section-shell p-8 text-center">
        <p>Please sign in to checkout.</p>
        <Link href="/signin" className="mt-3 inline-block text-[var(--brand)]">
          Sign in
        </Link>
      </div>
    );
  }
  const { cart, totals } = await getCartSummary(session.user.id);
  if (!cart || cart.items.length === 0) {
    return (
      <div className="section-shell p-8 text-center">
        <p>Your cart is empty.</p>
        <Link href="/shop" className="mt-3 inline-block text-[var(--brand)]">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="section-shell p-6">
        <h1 className="font-serif text-3xl font-bold">Checkout</h1>
        <p className="mb-5 mt-2 text-sm text-[#6e5841]">
          Mock payment mode: your order is placed as paid without real card
          processing.
        </p>
        <form action={checkoutAction} className="grid gap-3">
          <input
            required
            name="line1"
            placeholder="Street address"
            className="rounded-md border px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              name="city"
              placeholder="City"
              className="rounded-md border px-3 py-2"
            />
            <input
              required
              name="state"
              placeholder="State"
              className="rounded-md border px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              name="postalCode"
              placeholder="Postal code"
              className="rounded-md border px-3 py-2"
            />
            <input
              required
              defaultValue="US"
              name="country"
              placeholder="Country"
              className="rounded-md border px-3 py-2"
            />
          </div>
          <button className="mt-2 rounded-md bg-[var(--brand)] px-4 py-2 font-semibold text-white">
            Place order
          </button>
        </form>
      </section>

      <aside className="section-shell h-fit p-4">
        <h2 className="font-serif text-xl font-bold">Order Totals</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd>{formatPrice(totals.tax)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{formatPrice(totals.shipping)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
