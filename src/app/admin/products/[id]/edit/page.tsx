import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProductDetailsAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export default async function AdminEditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const hasInvalidInputError = query.error === "invalid-product-input";

  const [product, categories, suppliers] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">Edit Product</h1>
        <Link href="/admin/products" className="text-sm text-[var(--brand)]">
          Back to products
        </Link>
      </div>
      {hasInvalidInputError ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-900">
          Invalid product input. Check pricing, shipping, required details, and
          keep uploads at 5 images max, 5 MB each, 20 MB total.
        </p>
      ) : null}
      <form
        action={updateProductDetailsAction}
        className="section-shell grid gap-3 p-4"
      >
        <input type="hidden" name="id" value={product.id} />
        <div className="grid gap-2 md:grid-cols-2">
          <input
            name="title"
            required
            defaultValue={product.title}
            placeholder="Product title"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="sku"
            required
            defaultValue={product.sku}
            placeholder="Store SKU"
            className="rounded-md border px-3 py-2"
          />
        </div>
        <textarea
          name="description"
          required
          minLength={10}
          defaultValue={product.description}
          placeholder="Description"
          className="rounded-md border px-3 py-2"
          rows={5}
        />
        <div className="grid gap-2 md:grid-cols-4">
          <input
            name="price"
            type="number"
            min={1}
            step="0.01"
            required
            defaultValue={Number(product.price)}
            placeholder="Retail price"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="supplierCost"
            type="number"
            min={0}
            step="0.01"
            defaultValue={Number(product.supplierCost ?? 0)}
            placeholder="Supplier cost"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="markupPercent"
            type="number"
            min={0}
            defaultValue={product.markupPercent}
            placeholder="Markup %"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="compareAtPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={Number(product.compareAtPrice ?? 0)}
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
            defaultValue={product.stock}
            placeholder="Stock"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="supplierSku"
            defaultValue={product.supplierSku ?? ""}
            placeholder="Supplier SKU"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="averageRating"
            type="number"
            min={1}
            max={5}
            step="0.1"
            defaultValue={Number(product.averageRating)}
            placeholder="Rating"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="variantSummary"
            defaultValue={product.variantSummary ?? ""}
            placeholder="Variants"
            className="rounded-md border px-3 py-2"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <select
            name="categoryId"
            required
            className="rounded-md border px-3 py-2"
            defaultValue={product.categoryId}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            name="supplierId"
            className="rounded-md border px-3 py-2"
            defaultValue={product.supplierId ?? ""}
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
            defaultValue={product.shippingLeadMin}
            placeholder="Ship min days"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="shippingLeadMax"
            type="number"
            min={1}
            defaultValue={product.shippingLeadMax}
            placeholder="Ship max days"
            className="rounded-md border px-3 py-2"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-start">
          <div className="grid grid-cols-2 gap-2">
            {product.images.slice(0, 5).map((image) => (
              <div
                key={image.id}
                className="relative h-24 overflow-hidden rounded-md bg-[#f8f2ea]"
              >
                <Image
                  src={image.path}
                  alt={image.alt ?? product.title}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            {product.images.length === 0 ? (
              <div className="relative h-24 overflow-hidden rounded-md bg-[#f8f2ea]">
                <Image
                  src="/globe.svg"
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
          <label className="text-sm font-medium text-[#475569]">
            Replace product gallery (up to 5 images)
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
        </div>
        <div className="grid gap-2 text-sm md:grid-cols-4">
          <label className="flex items-center gap-2">
            <input name="isActive" type="checkbox" defaultChecked={product.isActive} />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              name="isBestSeller"
              type="checkbox"
              defaultChecked={product.isBestSeller}
            />
            Best seller
          </label>
          <label className="flex items-center gap-2">
            <input name="isTrending" type="checkbox" defaultChecked={product.isTrending} />
            Trending
          </label>
          <label className="flex items-center gap-2">
            <input
              name="fastShippingEligible"
              type="checkbox"
              defaultChecked={product.fastShippingEligible}
            />
            Fast shipping
          </label>
        </div>
        <button className="rounded-md bg-[var(--brand)] px-4 py-2 font-semibold text-white">
          Save changes
        </button>
      </form>
    </div>
  );
}
