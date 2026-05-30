import Image from "next/image";
import Link from "next/link";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/lib/actions";
import { formatPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const hasInvalidInputError = params.error === "invalid-product-input";
  const [products, categories, suppliers] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, images: true, supplier: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold">Manage Products</h1>
      {hasInvalidInputError ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-900">
          Invalid product input. Check the shipping window, pricing, required
          details, and keep uploads at 5 images max, 5 MB each, 20 MB total.
        </p>
      ) : null}
      <form
        action={createProductAction}
        className="section-shell grid gap-3 p-4"
      >
        <div className="grid gap-2 md:grid-cols-2">
          <input
            name="title"
            required
            placeholder="Product title"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="sku"
            required
            placeholder="Store SKU"
            className="rounded-md border px-3 py-2"
          />
        </div>
        <textarea
          name="description"
          required
          minLength={10}
          placeholder="Description"
          className="rounded-md border px-3 py-2"
          rows={4}
        />
        <div className="grid gap-2 md:grid-cols-4">
          <input
            name="price"
            type="number"
            min={1}
            step="0.01"
            required
            placeholder="Retail price"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="supplierCost"
            type="number"
            min={0}
            step="0.01"
            placeholder="Supplier cost"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="markupPercent"
            type="number"
            min={0}
            defaultValue={35}
            placeholder="Markup %"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="compareAtPrice"
            type="number"
            min={0}
            step="0.01"
            placeholder="Compare at"
            className="rounded-md border px-3 py-2"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <input
            name="stock"
            type="number"
            min={0}
            required
            placeholder="Stock"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="supplierSku"
            placeholder="Supplier SKU"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="averageRating"
            type="number"
            min={1}
            max={5}
            step="0.1"
            defaultValue={4.5}
            placeholder="Rating"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="variantSummary"
            placeholder="Variants, comma separated"
            className="rounded-md border px-3 py-2"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <select
            name="categoryId"
            required
            className="rounded-md border px-3 py-2"
            defaultValue=""
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            name="supplierId"
            className="rounded-md border px-3 py-2"
            defaultValue=""
          >
            <option value="">No supplier yet</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <input
            name="shippingLeadMin"
            type="number"
            min={1}
            defaultValue={5}
            placeholder="Ship min days"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="shippingLeadMax"
            type="number"
            min={1}
            defaultValue={10}
            placeholder="Ship max days"
            className="rounded-md border px-3 py-2"
          />
        </div>
        <label className="text-sm font-medium text-[#475569]">
          Product gallery (up to 5 images)
          <span className="mt-1 block text-xs text-[#6b678a]">
            Keep each image under 5 MB and the full gallery under 20 MB.
          </span>
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </label>
        <div className="grid gap-2 text-sm md:grid-cols-4">
          <label className="flex items-center gap-2">
            <input name="isActive" type="checkbox" defaultChecked />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input name="isBestSeller" type="checkbox" />
            Best seller
          </label>
          <label className="flex items-center gap-2">
            <input name="isTrending" type="checkbox" />
            Trending
          </label>
          <label className="flex items-center gap-2">
            <input name="fastShippingEligible" type="checkbox" />
            Fast shipping
          </label>
        </div>
        <button className="rounded-md bg-[var(--brand)] px-4 py-2 font-semibold text-white">
          Create Product
        </button>
      </form>

      <div className="section-shell overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#eff6ff]">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md bg-[#f8f2ea]">
                      <Image
                        src={product.images[0]?.path ?? "/globe.svg"}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{product.title}</p>
                      <p className="text-xs text-[#475569]">
                        {product.sku} • {product.category.name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p>{product.supplier?.name ?? "Unassigned"}</p>
                  <p className="text-xs text-[#475569]">
                    {product.shippingLabel}
                  </p>
                </td>
                <td className="px-4 py-3">{formatPrice(Number(product.price))}</td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="inline-block text-xs text-[var(--brand)]"
                    >
                      Edit details
                    </Link>
                    <form action={updateProductAction} className="space-y-1">
                      <input type="hidden" name="id" value={product.id} />
                      <input
                        type="number"
                        min={1}
                        step="0.01"
                        name="price"
                        defaultValue={Number(product.price)}
                        className="w-24 rounded-md border px-2 py-1"
                      />
                      <input
                        type="number"
                        min={0}
                        name="stock"
                        defaultValue={product.stock}
                        className="w-20 rounded-md border px-2 py-1"
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={product.isActive}
                        />
                        Active
                      </label>
                      <button className="text-xs text-[var(--brand)]">Save</button>
                    </form>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <button className="text-xs text-red-700">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
