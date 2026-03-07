import Link from "next/link";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user.role === Role.ADMIN;

  return (
    <header className="brand-gradient border-b border-[#e7dac8]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-serif text-3xl font-bold tracking-wide">
            Vinaroda
          </Link>
          <nav className="hidden gap-4 text-sm font-semibold md:flex">
            <Link href="/shop">Shop</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/account/wishlist">Wishlist</Link>
            <Link href="/account/orders">Orders</Link>
            {isAdmin ? <Link href="/admin">Admin</Link> : null}
          </nav>
        </div>
        <div className="flex gap-3 text-sm font-semibold">
          {session ? (
            <>
              <span className="hidden text-xs text-[#5d4630] sm:inline">
                {session.user.name}
              </span>
              <Link
                href="/signout"
                className="rounded-md bg-[var(--brand)] px-3 py-2 text-white"
              >
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link href="/signin" className="rounded-md border px-3 py-2">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[var(--brand)] px-3 py-2 text-white"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
