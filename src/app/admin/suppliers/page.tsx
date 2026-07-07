import {
  createSupplierAction,
  deleteSupplierAction,
  importCuratedDummyJsonCatalogAction,
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
  const imported = params.imported === "1";
  const createdCount =
    typeof params.created === "string" ? Number(params.created) || 0 : 0;
  const updatedCount =
    typeof params.updated === "string" ? Number(params.updated) || 0 : 0;
  const skippedCount =
    typeof params.skipped === "string" ? Number(params.skipped) || 0 : 0;
  const selectedCount =
    typeof params.selected === "string" ? Number(params.selected) || 0 : 0;
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
          {error === "dummyjson-import-failed"
            ? "The curated DummyJSON import failed. Check the network connection or source feed and try again."
            : "Supplier input or import JSON was invalid."}
        </p>
      ) : null}
      {imported ? (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-950">
          Curated DummyJSON import complete. Selected {selectedCount}, created{" "}
          {createdCount}, updated {updatedCount}, skipped {skippedCount}.
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

        <div className="grid gap-4">
          <form
            action={importCuratedDummyJsonCatalogAction}
            className="section-shell grid gap-3 p-4"
          >
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold">
                Curated DummyJSON Catalog
              </h2>
              <p className="text-sm text-[#475569]">
                Imports a curated 30-50 product catalog across Women, Men, Home,
                Beauty, and Electronics. Only products with 3-5 source images,
                strong ratings, and acceptable shipping windows are included.
              </p>
            </div>
            <div className="grid gap-2 rounded-2xl bg-[#f8f8ff] p-4 text-sm text-[#475569] md:grid-cols-2">
              <p>Target: 40 curated products with a 30 product minimum.</p>
              <p>Images: downloaded locally into your own uploads folder.</p>
              <p>Behavior: reruns update existing DummyJSON imports by SKU.</p>
              <p>Result: home, shop, and product galleries fill out automatically.</p>
            </div>
            <button className="w-fit rounded-md bg-[var(--brand)] px-4 py-2 text-white">
              Import curated DummyJSON catalog
            </button>
          </form>

          <form action={importSupplierProductsAction} className="section-shell grid gap-3 p-4">
            <h2 className="font-serif text-2xl font-bold">Manual Supplier Import</h2>
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
