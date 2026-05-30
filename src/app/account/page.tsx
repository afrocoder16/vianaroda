import Link from "next/link";
import { PaymentMethod } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  saveAddressAction,
  savePaymentMethodAction,
} from "@/lib/actions";
import { authOptions } from "@/lib/auth";
import { getPaymentMethodLabel } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin");
  }

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  const [orders, addresses, paymentMethods] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.savedPaymentMethod.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="brand-gradient section-shell flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--brand)]">
            Account
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">
            Welcome back. Here&apos;s everything in one place.
          </h1>
          <p className="text-sm text-[#5f5b74]">{session.user.email}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href="/account/orders"
            className="rounded-full border border-[#d9d4ff] px-4 py-2"
          >
            Your Orders
          </Link>
          <Link
            href="/account/wishlist"
            className="rounded-full border border-[#d9d4ff] px-4 py-2"
          >
            Wishlist
          </Link>
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-900">
          There was a problem saving your account details.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="section-shell p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-[-0.03em]">Your Orders</h2>
              <Link href="/account/orders" className="text-sm text-[var(--brand)]">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-[#475569]">No orders yet.</p>
              ) : (
                orders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-[#d6dde7] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">Order #{order.id.slice(-8)}</p>
                      <p className="text-sm text-[#475569]">{order.status}</p>
                    </div>
                    <p className="mt-2 text-sm text-[#334155]">
                      Tracking: {order.trackingNumber ?? "Pending supplier scan"}
                    </p>
                    <p className="text-sm text-[#334155]">
                      ETA: {order.estimatedDelivery ?? "Pending"}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="section-shell p-5">
            <h2 className="text-2xl font-black tracking-[-0.03em]">Saved Addresses</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className="rounded-2xl border border-[#d6dde7] p-4 text-sm"
                >
                  <p className="font-semibold">{address.label ?? "Address"}</p>
                  <p>{address.line1}</p>
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </article>
              ))}
            </div>

            <form action={saveAddressAction} className="mt-5 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input name="label" placeholder="Label" className="rounded-md border px-3 py-2" />
                <input name="phone" placeholder="Phone" className="rounded-md border px-3 py-2" />
              </div>
              <input
                required
                name="line1"
                placeholder="Street address"
                className="rounded-md border px-3 py-2"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input required name="city" placeholder="City" className="rounded-md border px-3 py-2" />
                <input required name="state" placeholder="State" className="rounded-md border px-3 py-2" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  required
                  name="postalCode"
                  placeholder="Postal code"
                  className="rounded-md border px-3 py-2"
                />
                <input
                  required
                  name="country"
                  defaultValue="US"
                  placeholder="Country"
                  className="rounded-md border px-3 py-2"
                />
              </div>
              <button className="w-fit rounded-md bg-[var(--brand)] px-4 py-2 text-white">
                Save address
              </button>
            </form>
          </div>
        </section>

        <section className="section-shell p-5">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Payment Methods</h2>
          <div className="mt-4 space-y-3">
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-[#475569]">
                No saved payment methods yet.
              </p>
            ) : (
              paymentMethods.map((method) => (
                <article
                  key={method.id}
                  className="rounded-2xl border border-[#d6dde7] p-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{method.label}</p>
                    {method.isDefault ? (
                      <span className="rounded-full bg-[#dbeafe] px-2 py-1 text-xs text-[#1d4ed8]">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[#475569]">{getPaymentMethodLabel(method.provider)}</p>
                  {method.last4 ? <p className="text-[#475569]">Ending in {method.last4}</p> : null}
                </article>
              ))
            )}
          </div>

          <form action={savePaymentMethodAction} className="mt-5 grid gap-3">
            <select name="provider" className="rounded-md border px-3 py-2" defaultValue={PaymentMethod.STRIPE_CARD}>
              {Object.values(PaymentMethod).map((method) => (
                <option key={method} value={method}>
                  {getPaymentMethodLabel(method)}
                </option>
              ))}
            </select>
            <input
              required
              name="label"
              placeholder="Friendly name, e.g. Business Visa"
              className="rounded-md border px-3 py-2"
            />
            <input
              name="last4"
              maxLength={4}
              placeholder="Last 4 digits"
              className="rounded-md border px-3 py-2"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isDefault" defaultChecked />
              Set as default
            </label>
            <button className="w-fit rounded-md bg-[var(--brand)] px-4 py-2 text-white">
              Save payment method
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
