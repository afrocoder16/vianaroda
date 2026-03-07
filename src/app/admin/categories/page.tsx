import { createCategoryAction, deleteCategoryAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold">Manage Categories</h1>
      <form action={createCategoryAction} className="section-shell flex gap-2 p-4">
        <input
          name="name"
          required
          placeholder="Category name"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button className="rounded-md bg-[var(--brand)] px-4 py-2 font-semibold text-white">
          Add
        </button>
      </form>
      <div className="section-shell overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f4ecde]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t">
                <td className="px-4 py-3">{category.name}</td>
                <td className="px-4 py-3">{category.slug}</td>
                <td className="px-4 py-3">{category._count.products}</td>
                <td className="px-4 py-3">
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={category.id} />
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
