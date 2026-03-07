import { formatPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [orderCount, productCount, recentOrders, topProducts, revenueAgg] =
    await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.aggregate({ _sum: { total: true } }),
    ]);

  const topProductIds = topProducts.map((item) => item.productId);
  const topProductMeta = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="section-shell p-4">
          <p className="text-sm text-[#6d5741]">Revenue</p>
          <h2 className="text-2xl font-black text-[var(--brand)]">
            {formatPrice(Number(revenueAgg._sum.total ?? 0))}
          </h2>
        </article>
        <article className="section-shell p-4">
          <p className="text-sm text-[#6d5741]">Orders</p>
          <h2 className="text-2xl font-black">{orderCount}</h2>
        </article>
        <article className="section-shell p-4">
          <p className="text-sm text-[#6d5741]">Products</p>
          <h2 className="text-2xl font-black">{productCount}</h2>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="section-shell p-4">
          <h2 className="font-serif text-xl font-bold">Recent Orders</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex justify-between border-b pb-2">
                <span>{order.user.name}</span>
                <span>{formatPrice(Number(order.total))}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="section-shell p-4">
          <h2 className="font-serif text-xl font-bold">Top Products</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {topProducts.map((item) => {
              const product = topProductMeta.find((p) => p.id === item.productId);
              return (
                <li key={item.productId} className="flex justify-between border-b pb-2">
                  <span>{product?.title ?? "Unknown product"}</span>
                  <span>{item._sum.quantity ?? 0} sold</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
