import Link from "next/link";
import { PaymentMethod } from "@prisma/client";
import { getServerSession } from "next-auth";
import { checkoutAction, getCartSummary } from "@/lib/actions";
import { authOptions } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { formatPrice, getPaymentMethodLabel } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const hasError = query.error === "invalid-checkout";
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

  const [{ cart, totals }, savedAddress, savedMethods] = await Promise.all([
    getCartSummary(session.user.id),
    prisma.address.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedPaymentMethod.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);

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
    <div className="space-y-6">
      <section className="brand-gradient rounded-[2rem] border border-[#d9d4ff] p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand)]">
          Checkout
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">
          Almost there.
        </h1>
        <p className="mt-3 text-[#5f5b74]">
          You&apos;re one step away from something great.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="section-shell p-6">
          {hasError ? (
            <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-900">
              Please complete all checkout fields before placing the order.
            </p>
          ) : null}

          <form action={checkoutAction} className="mt-2 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                required
                name="customerName"
                defaultValue={session.user.name ?? ""}
                placeholder="Full name"
                className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
              />
              <input
                required
                type="email"
                name="email"
                defaultValue={session.user.email ?? ""}
                placeholder="Email"
                className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                required
                name="phone"
                defaultValue={savedAddress?.phone ?? ""}
                placeholder="Phone"
                className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
              />
              <input
                required
                name="line1"
                defaultValue={savedAddress?.line1 ?? ""}
                placeholder="Street address"
                className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                required
                name="city"
                defaultValue={savedAddress?.city ?? ""}
                placeholder="City"
                className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
              />
              <input
                required
                name="state"
                defaultValue={savedAddress?.state ?? ""}
                placeholder="State"
                className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                required
                name="postalCode"
                defaultValue={savedAddress?.postalCode ?? ""}
                placeholder="Postal code"
                className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
              />
              <input
                required
                defaultValue={savedAddress?.country ?? "US"}
                name="country"
                placeholder="Country"
                className="rounded-2xl border border-[#d9d4ff] px-4 py-3"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">
                Payment Method <span className="font-normal text-[#8b87a3]">(demo &mdash; not charged)</span>
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.values(PaymentMethod).map((method) => (
                  <label
                    key={method}
                    className="rounded-[1.25rem] border border-[#d9d4ff] p-4 text-sm"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      defaultChecked={
                        method ===
                        (savedMethods[0]?.provider ?? PaymentMethod.STRIPE_CARD)
                      }
                      className="mr-2"
                    />
                    {getPaymentMethodLabel(method)}
                  </label>
                ))}
              </div>
            </div>

            <p className="rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
              <strong>Demo checkout.</strong> No payment is collected and no card
              is charged. Your order is recorded as a pending demo order only.
            </p>

            <button className="mt-2 rounded-full bg-[var(--brand)] px-4 py-3 font-semibold text-white">
              Place Demo Order
            </button>
          </form>
        </section>

        <aside className="section-shell h-fit p-5">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Order Summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>
                  {item.product.title} x {item.quantity}
                </span>
                <span>{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
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
            <div className="flex justify-between border-t border-[#ece9ff] pt-2 font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(totals.total)}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-2xl bg-[#e7fbf4] p-4 text-sm text-[var(--accent)]">
            {brand.tagline}
          </div>
        </aside>
      </div>
    </div>
  );
}
