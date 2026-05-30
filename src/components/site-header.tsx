import Link from "next/link";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { prisma } from "@/lib/prisma";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user.role === Role.ADMIN;
  const cartCount = session?.user.id
    ? await prisma.cartItem.count({
        where: { cart: { userId: session.user.id } },
      })
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-[#d9d4ff]/70 bg-white/88 text-[var(--foreground)] backdrop-blur-xl">
      <div className="border-b border-[#ece9ff] bg-[var(--brand)] text-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
          <p>{brand.subTagline}</p>
          <Link href="/support" className="font-semibold text-white">
            We&apos;re here. Always.
          </Link>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[180px_1fr_auto] lg:px-8">
        <Link href="/" className="leading-none">
          <span className="block text-3xl font-black tracking-[-0.04em] text-[var(--brand)]">
            {brand.name}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f68b6]">
            {brand.tagline}
          </span>
        </Link>

        <form
          action="/shop"
          className="soft-ring flex overflow-hidden rounded-full border border-[#d9d4ff] bg-white"
        >
          <input
            name="q"
            placeholder="Search products, brands, and categories"
            className="w-full px-4 py-3 text-sm text-[var(--foreground)]"
          />
          <button className="bg-[var(--brand)] px-5 font-semibold text-white">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-semibold">
          <Link
            href="/account"
            className="rounded-full border border-[#d9d4ff] px-4 py-2"
          >
            Account
          </Link>
          <Link
            href="/cart"
            className="rounded-full bg-[var(--accent)] px-4 py-2 font-bold text-white"
          >
            Cart ({cartCount})
          </Link>
          {session ? (
            <>
              <span className="hidden text-xs text-[#d3e1ff] sm:inline">
                {session.user.name}
              </span>
              <Link
                href="/signout"
                className="rounded-full border border-[#d9d4ff] px-4 py-2"
              >
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-full border border-[#d9d4ff] px-4 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[var(--brand)] px-4 py-2 text-white"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 pb-4 text-sm font-semibold text-[#4c4689] sm:px-6 lg:px-8">
        <Link href="/shop" className="rounded-full px-3 py-2 transition hover:bg-[#efedff]">
          All Departments
        </Link>
        <Link
          href="/shop?sort=best-selling"
          className="rounded-full px-3 py-2 transition hover:bg-[#efedff]"
        >
          Best Sellers
        </Link>
        <Link
          href="/shop?sort=newest"
          className="rounded-full px-3 py-2 transition hover:bg-[#efedff]"
        >
          New Arrivals
        </Link>
        <Link
          href="/shop?shipping=fast"
          className="rounded-full px-3 py-2 transition hover:bg-[#efedff]"
        >
          Fast Shipping
        </Link>
        <Link
          href="/shop?max=25"
          className="rounded-full px-3 py-2 transition hover:bg-[#efedff]"
        >
          Under $25
        </Link>
        <Link
          href="/account/orders"
          className="rounded-full px-3 py-2 transition hover:bg-[#efedff]"
        >
          Orders
        </Link>
        <Link
          href="/account/wishlist"
          className="rounded-full px-3 py-2 transition hover:bg-[#efedff]"
        >
          Wishlist
        </Link>
        {isAdmin ? (
          <Link href="/admin" className="rounded-full px-3 py-2 transition hover:bg-[#efedff]">
            Admin
          </Link>
        ) : null}
      </div>
    </header>
  );
}
