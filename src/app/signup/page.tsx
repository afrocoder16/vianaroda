import Link from "next/link";
import { registerUserAction } from "@/lib/actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const hasEmailExistsError = params.error === "EmailExists";
  const hasInvalidInputError = params.error === "InvalidInput";

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="section-shell overflow-hidden bg-[#231f4f] p-8 text-white md:p-10">
        <div className="space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c9c5f5]">
            Create your account
          </p>
          <h1 className="max-w-xl text-5xl font-black leading-none tracking-[-0.06em] md:text-6xl">
            Build your faster way to shop.
          </h1>
          <p className="max-w-lg text-base leading-7 text-[#ddd9ff]">
            Save addresses, track orders, keep your wishlist close, and move through
            checkout with less friction every time you come back.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-bold">Track every order</p>
              <p className="mt-1 text-sm text-[#d7d3ff]">Shipping status and delivery updates in one place.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-bold">Save favorites</p>
              <p className="mt-1 text-sm text-[#d7d3ff]">Come back to products you’re still thinking about.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-bold">Checkout faster</p>
              <p className="mt-1 text-sm text-[#d7d3ff]">Less typing, fewer steps, cleaner repeat purchases.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mx-auto w-full max-w-xl p-6 md:p-8">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--brand)]">
            Join Vinaroda
          </p>
          <h2 className="text-4xl font-black tracking-[-0.05em] text-[#231f4f]">
            Create account
          </h2>
          <p className="text-sm text-[#5f5b74]">
            Set up your account once and keep your shopping simple after that.
          </p>
        </div>

        <form action={registerUserAction} className="mt-6 space-y-4">
          {hasEmailExistsError ? (
            <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-900">
              That email already has an account. Sign in instead.
            </p>
          ) : null}
          {hasInvalidInputError ? (
            <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-900">
              Please enter a valid name, email, and a password of at least 8
              characters.
            </p>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#312c5c]">Full name</span>
            <input
              name="name"
              required
              minLength={2}
              placeholder="Your full name"
              className="w-full rounded-2xl border px-4 py-3"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#312c5c]">Email</span>
            <input
              name="email"
              required
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-2xl border px-4 py-3"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#312c5c]">Password</span>
            <input
              name="password"
              required
              type="password"
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full rounded-2xl border px-4 py-3"
            />
          </label>

          <button className="w-full rounded-2xl bg-[linear-gradient(135deg,var(--brand),#6558d3)] px-4 py-3.5 font-semibold text-white">
            Create account
          </button>
        </form>

        <div className="mt-6 rounded-[1.5rem] border border-[#ebe8ff] bg-[#faf9ff] p-4">
          <p className="text-sm font-semibold text-[#231f4f]">
            Already have an account?
          </p>
          <p className="mt-1 text-sm text-[#5f5b74]">
            Sign in to access your orders, wishlist, and saved details.
          </p>
          <Link
            className="mt-4 inline-flex rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[var(--brand)] shadow-[0_10px_24px_rgba(83,74,183,0.08)] ring-1 ring-[#ddd8ff] transition hover:-translate-y-0.5"
            href="/signin"
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
