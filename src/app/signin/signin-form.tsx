"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function SignInForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  const registered = searchParams.get("registered") === "1";

  return (
    <section className="section-shell mx-auto w-full max-w-xl p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--brand)]">
          Account access
        </p>
        <h2 className="text-4xl font-black tracking-[-0.05em] text-[#231f4f]">
          Sign in
        </h2>
        <p className="text-sm text-[#5f5b74]">
          Access your orders, wishlist, saved addresses, and faster checkout.
        </p>
      </div>

      <form action={handleSubmit} className="mt-6 space-y-4">
        {registered ? (
          <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">
            Account created. Please sign in.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-900">
            {error}
          </p>
        ) : null}

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
            placeholder="Enter your password"
            className="w-full rounded-2xl border px-4 py-3"
          />
        </label>

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-[linear-gradient(135deg,var(--brand),#6558d3)] px-4 py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 rounded-[1.5rem] border border-[#ebe8ff] bg-[#faf9ff] p-4">
        <p className="text-sm font-semibold text-[#231f4f]">
          New to {`Vinaroda`}? Create your account in under a minute.
        </p>
        <p className="mt-1 text-sm text-[#5f5b74]">
          Save your cart, follow deliveries, and keep checkout simple.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-flex rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[var(--brand)] shadow-[0_10px_24px_rgba(83,74,183,0.08)] ring-1 ring-[#ddd8ff] transition hover:-translate-y-0.5"
        >
          Create account
        </Link>
      </div>
    </section>
  );
}
