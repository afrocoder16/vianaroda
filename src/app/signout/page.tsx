"use client";

import { signOut } from "next-auth/react";

export default function SignOutPage() {
  return (
    <div className="section-shell mx-auto max-w-md space-y-4 p-6 text-center">
      <h1 className="font-serif text-3xl font-bold">Sign Out</h1>
      <p>Are you sure you want to sign out?</p>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full rounded-md bg-[var(--brand)] px-4 py-2 font-semibold text-white"
      >
        Sign out
      </button>
    </div>
  );
}
