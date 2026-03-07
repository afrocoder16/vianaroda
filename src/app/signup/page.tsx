import Link from "next/link";
import { registerUserAction } from "@/lib/actions";

export default function SignUpPage() {
  return (
    <form action={registerUserAction} className="section-shell mx-auto max-w-md space-y-3 p-6">
      <h1 className="font-serif text-3xl font-bold">Create Account</h1>
      <input
        name="name"
        required
        minLength={2}
        placeholder="Full name"
        className="w-full rounded-md border px-3 py-2"
      />
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
        minLength={6}
        placeholder="Password"
        className="w-full rounded-md border px-3 py-2"
      />
      <button className="w-full rounded-md bg-[var(--brand)] px-4 py-2 font-semibold text-white">
        Create account
      </button>
      <p className="text-sm text-[#6e5841]">
        Already have an account?{" "}
        <Link className="text-[var(--brand)]" href="/signin">
          Sign in
        </Link>
      </p>
    </form>
  );
}
