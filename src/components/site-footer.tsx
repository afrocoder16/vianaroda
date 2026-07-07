import Link from "next/link";
import { brand } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="footer-sheen mt-24 overflow-hidden border-t border-white/8 text-[#efeefe]">
      <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_24px_80px_rgba(8,6,26,0.26)] backdrop-blur md:grid-cols-[1.2fr_auto] md:items-center">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#bdb8ef]">
              {brand.subTagline}
            </p>
            <h2 className="max-w-2xl text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              A marketplace feel, with a boutique finish.
            </h2>
            <p className="max-w-2xl text-sm text-[#d7d3ff] md:text-base">
              Discover something new every day across fashion, beauty, home,
              and tech, without the clutter.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/shop"
              className="rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-[#231f4f] transition hover:-translate-y-0.5"
            >
              Shop the catalog
            </Link>
            <Link
              href="/support"
              className="rounded-full border border-white/18 bg-white/8 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/12"
            >
              Talk to support
            </Link>
          </div>
        </div>

        <div className="grid gap-10 px-0 py-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <div>
              <p className="text-4xl font-black tracking-[-0.05em] text-white">
                {brand.name}
              </p>
              <p className="mt-2 max-w-sm text-base text-[#d9d6ff]">
                {brand.subTagline}
              </p>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#bdb8ef]">
              Curated drops, better pricing, and a cleaner way to shop online.
              Built to help customers find what they want fast and buy with
              confidence.
            </p>
            <div className="grid max-w-md grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                <p className="text-lg font-black text-white">Fast</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#bdb8ef]">
                  Shipping
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                <p className="text-lg font-black text-white">Safe</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#bdb8ef]">
                  Checkout
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                <p className="text-lg font-black text-white">Real</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#bdb8ef]">
                  Support
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <p className="font-semibold uppercase tracking-[0.2em] text-white/95">
              Shop
            </p>
            <Link href="/shop" className="text-[#d7d3ff] transition hover:text-white">
              All products
            </Link>
            <Link
              href="/shop?sort=best-selling"
              className="text-[#d7d3ff] transition hover:text-white"
            >
              Best sellers
            </Link>
            <Link
              href="/shop?sort=newest"
              className="text-[#d7d3ff] transition hover:text-white"
            >
              New arrivals
            </Link>
            <Link href="/shop?max=25" className="text-[#d7d3ff] transition hover:text-white">
              Under $25
            </Link>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <p className="font-semibold uppercase tracking-[0.2em] text-white/95">
              Help
            </p>
            <Link href="/support" className="text-[#d7d3ff] transition hover:text-white">
              Support
            </Link>
            <Link
              href="/support#returns"
              className="text-[#d7d3ff] transition hover:text-white"
            >
              Returns & refunds
            </Link>
            <Link
              href="/support#faq"
              className="text-[#d7d3ff] transition hover:text-white"
            >
              Common questions
            </Link>
            <Link
              href="/support#contact"
              className="text-[#d7d3ff] transition hover:text-white"
            >
              Send us a message
            </Link>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <p className="font-semibold uppercase tracking-[0.2em] text-white/95">
              Account & trust
            </p>
            <Link href="/account" className="text-[#d7d3ff] transition hover:text-white">
              Account
            </Link>
            <Link href="/cart" className="text-[#d7d3ff] transition hover:text-white">
              Cart
            </Link>
            <span className="text-[#d7d3ff]">Privacy Policy</span>
            <span className="text-[#d7d3ff]">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-[#c8c3f3] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            (c) 2026 {brand.name}. {brand.tagline}
          </p>
          <p className="text-[#9f99d1]">
            Your store. Your everything. Built for fast, beautiful shopping.
          </p>
        </div>
      </div>
    </footer>
  );
}
