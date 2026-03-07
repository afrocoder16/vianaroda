import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section-shell mx-auto max-w-xl p-10 text-center">
      <h1 className="font-serif text-4xl font-bold">Page not found</h1>
      <p className="mt-2 text-[#6f5a44]">The page you requested does not exist.</p>
      <Link href="/" className="mt-4 inline-block text-[var(--brand)]">
        Return to home
      </Link>
    </div>
  );
}
