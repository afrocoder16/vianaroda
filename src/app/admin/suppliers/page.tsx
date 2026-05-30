import {
  createSupplierAction,
  deleteSupplierAction,
  importSupplierProductsAction,
} from "@/lib/actions";
import { prisma } from "@/lib/prisma";

const importTemplate = `[
  {
    "title": "Supplier Catalog Example",
    "description": "Imported product from a supplier feed.",
    "sku": "SUP-001",
    "supplierSku": "EXT-001",
    "supplierCost": 22,
    "markupPercent": 45,
    "stock": 40,
    "rating": 4.6,
    "shippingLeadMin": 4,
    "shippingLeadMax": 7,
    "fastShippingEligible": true,
    "isTrending": true,
    "variantSummary": "Black, White",
    "image": "/uploads/sample-tech-1.svg"
  }
]`;

export default async function AdminSuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const [suppliers, categories] = await Promise.all([
    prisma.supplier.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold">Suppliers & Imports</h1>
      {error ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-900">
          Supplier input or import JSON was invalid.
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <form action={createSupplierAction} className="section-shell grid gap-3 p-4">
          <h2 className="font-serif text-2xl font-bold">Add Supplier</h2>
          <input required name="name" placeholder="Supplier name" className="rounded-md border px-3 py-2" />
          <input required type="email" name="contactEmail" placeholder="Contact email" className="rounded-md border px-3 py-2" />
          <input name="contactPhone" placeholder="Contact phone" className="rounded-md border px-3 py-2" />
          <div className="grid gap-2 md:grid-cols-2">
            <input required type="number" min={1} name="leadTimeMin" defaultValue={5} placeholder="Lead time min" className="rounded-md border px-3 py-2" />
            <input required type="number" min={1} name="leadTimeMax" defaultValue={10} placeholder="Lead time max" className="rounded-md border px-3 py-2" />
          </div>
          <textarea name="notes" rows={3} placeholder="Notes" className="rounded-md border px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked />
            Active
          </label>
          <button className="w-fit rounded-md bg-[var(--brand)] px-4 py-2 text-white">
            Save supplier
          </button>
        </form>

        <form action={importSupplierProductsAction} className="section-shell grid gap-3 p-4">
          <h2 className="font-serif text-2xl font-bold">Import Products</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <select name="supplierId" required defaultValue="" className="rounded-md border px-3 py-2">
              <option value="" disabled>
                Select supplier
              </option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <select name="categoryId" required defaultValue="" className="rounded-md border px-3 py-2">
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="payload"
            rows={14}
            defaultValue={importTemplate}
            className="rounded-md border px-3 py-2 font-mono text-xs"
          />
          <button className="w-fit rounded-md bg-[#0f172a] px-4 py-2 text-white">
            Import supplier products
          </button>
        </form>
      </div>

      <div className="section-shell overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#eff6ff]">
            <tr>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold">{supplier.name}</p>
                  <p className="text-xs text-[#475569]">
                    {supplier.isActive ? "Active" : "Inactive"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p>{supplier.contactEmail}</p>
                  <p className="text-xs text-[#475569]">{supplier.contactPhone ?? "-"}</p>
                </td>
                <td className="px-4 py-3">{supplier.shippingWindow}</td>
                <td className="px-4 py-3">{supplier._count.products}</td>
                <td className="px-4 py-3">
                  <form action={deleteSupplierAction}>
                    <input type="hidden" name="id" value={supplier.id} />
                    <button className="text-red-700">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
