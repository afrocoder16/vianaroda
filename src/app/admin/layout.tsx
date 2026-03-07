import Link from "next/link";
import { requireAdminPage } from "@/lib/guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="section-shell h-fit space-y-2 p-4">
        <h2 className="font-serif text-2xl font-bold">Admin</h2>
        <nav className="grid gap-1 text-sm">
          <Link href="/admin" className="rounded-md px-2 py-1 hover:bg-[#f4ecde]">
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="rounded-md px-2 py-1 hover:bg-[#f4ecde]"
          >
            Products
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-md px-2 py-1 hover:bg-[#f4ecde]"
          >
            Categories
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-md px-2 py-1 hover:bg-[#f4ecde]"
          >
            Orders
          </Link>
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
