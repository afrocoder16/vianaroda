import { SupplierOrderStatus } from "@prisma/client";
import { formatPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [
    orderCount,
    productCount,
    supplierCount,
    recentOrders,
    topProducts,
    revenueAgg,
    backlogCount,
    refundedCount,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.supplier.count(),
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
    prisma.order.aggregate({ _sum: { total: true }, _avg: { total: true } }),
    prisma.order.count({
      where: {
        supplierOrderStatus: {
          in: [SupplierOrderStatus.DRAFT, SupplierOrderStatus.FORWARDED],
        },
      },
    }),
    prisma.order.count({
      where: {
        supplierOrderStatus: SupplierOrderStatus.REFUNDED,
      },
    }),
  ]);

  const topProductIds = topProducts.map((item) => item.productId);
  const topProductMeta = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, title: true, supplier: { select: { name: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="section-shell p-4">
          <p className="text-sm text-[#475569]">Revenue</p>
          <h2 className="text-2xl font-black text-[var(--brand)]">
            {formatPrice(Number(revenueAgg._sum.total ?? 0))}
          </h2>
        </article>
        <article className="section-shell p-4">
          <p className="text-sm text-[#475569]">Average order</p>
          <h2 className="text-2xl font-black">
            {formatPrice(Number(revenueAgg._avg.total ?? 0))}
          </h2>
        </article>
        <article className="section-shell p-4">
          <p className="text-sm text-[#475569]">Orders</p>
          <h2 className="text-2xl font-black">{orderCount}</h2>
        </article>
        <article className="section-shell p-4">
          <p className="text-sm text-[#475569]">Products</p>
          <h2 className="text-2xl font-black">{productCount}</h2>
        </article>
        <article className="section-shell p-4">
          <p className="text-sm text-[#475569]">Suppliers</p>
          <h2 className="text-2xl font-black">{supplierCount}</h2>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="section-shell p-4">
          <h2 className="font-serif text-xl font-bold">Fulfillment Queue</h2>
          <p className="mt-3 text-3xl font-black text-[#1d4ed8]">{backlogCount}</p>
          <p className="text-sm text-[#475569]">
            orders still waiting on supplier confirmation or handoff
          </p>
        </section>
        <section className="section-shell p-4">
          <h2 className="font-serif text-xl font-bold">Refunds Closed</h2>
          <p className="mt-3 text-3xl font-black text-[#be123c]">{refundedCount}</p>
          <p className="text-sm text-[#475569]">supplier refunds completed</p>
        </section>
        <section className="section-shell p-4">
          <h2 className="font-serif text-xl font-bold">Markup Control</h2>
          <p className="mt-3 text-sm text-[#475569]">
            Product-level supplier cost and markup settings are managed from the
            product editor.
          </p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="section-shell p-4">
          <h2 className="font-serif text-xl font-bold">Recent Orders</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex justify-between gap-3 border-b pb-2">
                <div>
                  <p className="font-semibold">{order.user.name}</p>
                  <p className="text-xs text-[#475569]">{order.supplierOrderStatus}</p>
                </div>
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
                <li key={item.productId} className="flex justify-between gap-3 border-b pb-2">
                  <div>
                    <p className="font-semibold">
                      {product?.title ?? "Unknown product"}
                    </p>
                    <p className="text-xs text-[#475569]">
                      {product?.supplier?.name ?? "No supplier"}
                    </p>
                  </div>
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
