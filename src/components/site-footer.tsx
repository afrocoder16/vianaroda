import Link from "next/link";
import { brand } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[#d9d4ff] bg-[radial-gradient(circle_at_top_left,_rgba(108,92,231,0.18),_transparent_30%),#231f4f] text-[#efeefe]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <p className="text-3xl font-black tracking-[-0.05em] text-white">
            {brand.name}
          </p>
          <p className="max-w-sm text-base text-[#d9d6ff]">
            {brand.subTagline}
          </p>
          <p className="max-w-sm text-sm text-[#c9c5f5]">
            Discover something new every day. Fashion, beauty, home, tech, and
            more in one place.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold uppercase tracking-[0.18em] text-white">Shop</p>
          <Link href="/shop" className="transition hover:text-white">All products</Link>
          <Link href="/shop?sort=newest" className="transition hover:text-white">New arrivals</Link>
          <Link href="/cart" className="transition hover:text-white">Cart</Link>
          <Link href="/account" className="transition hover:text-white">Account</Link>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold uppercase tracking-[0.18em] text-white">Help</p>
          <Link href="/support" className="transition hover:text-white">Support</Link>
          <Link href="/support#returns" className="transition hover:text-white">Returns & refunds</Link>
          <Link href="/support#faq" className="transition hover:text-white">Common Questions</Link>
          <Link href="/support#contact" className="transition hover:text-white">Send Us a Message</Link>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold uppercase tracking-[0.18em] text-white">Legal</p>
          <span>Privacy Policy</span>
          <span>Terms</span>
          <span>Secure Checkout</span>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-[#d9d6ff]">
        (c) 2026 {brand.name}. {brand.tagline}
      </div>
    </footer>
  );
}
