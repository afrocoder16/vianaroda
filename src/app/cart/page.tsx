import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  getCartSummary,
  getStorefrontProducts,
  updateCartItemAction,
} from "@/lib/actions";
import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/commerce";
import { authOptions } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import { ProductImageFrame } from "@/components/product-image-frame";

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="section-shell p-10 text-center">
        <h1 className="text-3xl font-black tracking-[-0.04em]">
          Sign in to view your cart
        </h1>
        <Link
          href="/signin"
          className="mt-4 inline-block rounded-full bg-[var(--brand)] px-5 py-3 text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const [{ cart, totals }, recommendations] = await Promise.all([
    getCartSummary(session.user.id),
    getStorefrontProducts({ sort: "best-selling", perPage: 4 }),
  ]);
  const items = cart?.items ?? [];

  return (
    <div className="space-y-8">
      <div className="section-shell flex flex-col gap-3 p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand)]">
            {brand.subTagline}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em]">
            Your cart is looking good.
          </h1>
        </div>
        <p className="text-sm text-[#5f5b74]">{brand.tagline}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {items.length === 0 ? (
            <div className="section-shell p-10 text-center">
              <p className="text-lg font-semibold">
                Nothing here yet - but that&apos;s easy to fix.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-block rounded-full bg-[var(--brand)] px-5 py-3 text-white"
              >
                Start browsing
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="section-shell grid gap-4 p-4 sm:grid-cols-[120px_1fr_auto]"
              >
                <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-[#f3f1ff]">
                  <ProductImageFrame
                    src={item.product.images[0]?.path ?? "/globe.svg"}
                    alt={item.product.title}
                    title={item.product.title}
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold">{item.product.title}</h2>
                  <p className="text-sm text-[#5f5b74]">
                    {item.product.shippingLabel}
                  </p>
                  <p className="text-sm font-semibold text-[var(--brand)]">
                    {formatPrice(Number(item.unitPrice))}
                  </p>
                </div>
                <div className="space-y-2">
                  <form action={updateCartItemAction} className="flex items-center gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input
                      type="number"
                      min={0}
                      defaultValue={item.quantity}
                      name="quantity"
                      className="w-16 rounded-full border border-[#d9d4ff] px-3 py-2"
                    />
                    <button className="rounded-full border border-[#d9d4ff] px-3 py-2 text-sm">
                      Update
                    </button>
                  </form>
                  <form action={updateCartItemAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="quantity" value={0} />
                    <button className="rounded-full border border-red-200 px-3 py-2 text-sm text-red-700">
                      Remove
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </section>

        <aside className="section-shell h-fit space-y-4 p-5">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Summary</h2>
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
          <div className="rounded-2xl bg-[#e7fbf4] px-4 py-3 text-sm text-[var(--accent)]">
            Free shipping on qualifying orders.
          </div>
          <div className="flex justify-between border-t border-[#ece9ff] pt-3 font-semibold">
            <span>Total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>
          {items.length > 0 ? (
            <Link
              href="/checkout"
              className="block rounded-full bg-[var(--brand)] px-4 py-3 text-center font-semibold text-white"
            >
              Checkout securely
            </Link>
          ) : null}
        </aside>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.04em]">
            You might also like these...
          </h2>
          <p className="text-sm text-[#5f5b74]">Discover something new every day.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {recommendations.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
