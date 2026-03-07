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

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
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
          Invalid product input. Description must be at least 10 characters.
        </p>
      ) : null}
      <form
        action={updateProductDetailsAction}
        className="section-shell grid gap-3 p-4"
        encType="multipart/form-data"
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
            placeholder="SKU"
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
            placeholder="Price"
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
          <input
            name="stock"
            type="number"
            min={0}
            required
            defaultValue={product.stock}
            placeholder="Stock"
            className="rounded-md border px-3 py-2"
          />
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
        </div>
        <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-md bg-[#f8f2ea]">
            <Image
              src={product.images[0]?.path ?? "/globe.svg"}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
          <label className="text-sm font-medium text-[#6d5741]">
            Replace product image
            <input
              type="file"
              name="image"
              accept="image/*"
              className="mt-1 block w-full rounded-md border px-3 py-2"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked={product.isActive} />
          Active
        </label>
        <button className="rounded-md bg-[var(--brand)] px-4 py-2 font-semibold text-white">
          Save changes
        </button>
      </form>
    </div>
  );
}
