"use client";

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
    <form action={handleSubmit} className="section-shell mx-auto max-w-md space-y-3 p-6">
      <h1 className="font-serif text-3xl font-bold">Sign In</h1>
      {registered ? (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-900">
          Account created. Please sign in.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-900">{error}</p>
      ) : null}
      <input
        name="email"
        required
        type="email"
        placeholder="Email"
        className="w-full rounded-md border px-3 py-2"
      />
      <input
        name="password"
        required
        type="password"
        placeholder="Password"
        className="w-full rounded-md border px-3 py-2"
      />
      <button
        disabled={loading}
        className="w-full rounded-md bg-[var(--brand)] px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
