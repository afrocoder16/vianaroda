import Link from "next/link";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { isDatabaseConnectionError } from "@/lib/database";
import { prisma } from "@/lib/prisma";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user.role === Role.ADMIN;
  const accountHref = session ? "/account" : "/signin";
  let cartCount = 0;

  if (session?.user.id) {
    try {
      cartCount = await prisma.cartItem.count({
        where: { cart: { userId: session.user.id } },
      });
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }
    }
  }

  const primaryLinks = [
    { href: "/shop", label: "All Departments" },
    { href: "/shop?sort=best-selling", label: "Best Sellers" },
    { href: "/shop?sort=newest", label: "New Arrivals" },
    { href: "/shop?shipping=fast", label: "Fast Shipping" },
    { href: "/shop?max=25", label: "Under $25" },
    { href: "/account/orders", label: "Orders" },
    { href: "/account/wishlist", label: "Wishlist" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#ddd8ff]/80 bg-white/86 text-[var(--foreground)] backdrop-blur-2xl">
      <div className="w-full px-4 py-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
          <Link href="/" className="min-w-fit leading-none">
            <span className="block text-[2.15rem] font-black tracking-[-0.06em] text-[var(--brand)]">
              {brand.name}
            </span>
            <span className="block text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[#6f68b6]">
              {brand.tagline}
            </span>
          </Link>

          <form
            action="/shop"
            className="soft-ring order-3 flex min-w-0 flex-1 overflow-hidden rounded-full border border-[#d9d4ff] bg-white xl:order-none"
          >
            <input
              name="q"
              placeholder="Search products, brands, and categories"
              className="w-full min-w-0 bg-transparent px-5 py-3.5 text-sm text-[var(--foreground)]"
            />
            <button className="min-w-24 bg-[linear-gradient(135deg,var(--brand),#6558d3)] px-6 font-semibold text-white transition hover:brightness-105">
              Search
            </button>
          </form>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2 text-sm font-semibold">
            <Link href={accountHref} className="nav-chip rounded-full px-4 py-2.5">
              Account
            </Link>
            <Link
              href="/cart"
              className="rounded-full bg-[linear-gradient(135deg,var(--accent),#27b78a)] px-4 py-2.5 font-bold text-white shadow-[0_12px_24px_rgba(29,158,117,0.24)] transition hover:-translate-y-0.5"
            >
              Cart ({cartCount})
            </Link>
            {session ? (
              <>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="nav-chip rounded-full px-4 py-2.5 text-[var(--brand)]"
                  >
                    Admin
                  </Link>
                ) : null}
                <Link href="/signout" className="nav-chip rounded-full px-4 py-2.5">
                  Sign out
                </Link>
              </>
            ) : (
              <>
                <Link href="/signin" className="nav-chip rounded-full px-4 py-2.5">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--brand)] px-4 py-2.5 text-white transition hover:bg-[var(--brand-dark)]"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#ece9ff] pt-3">
          <nav className="flex flex-1 flex-wrap items-center gap-2 text-sm font-semibold text-[#4c4689]">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 transition hover:bg-[#efedff]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/support"
            className="ml-auto text-sm font-semibold text-[var(--brand)] transition hover:text-[var(--brand-dark)]"
          >
            We&apos;re here. Always.
          </Link>
        </div>
      </div>
    </header>
  );
}
