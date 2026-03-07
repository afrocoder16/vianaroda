import { OrderStatus } from "@prisma/client";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { updateOrderStatusAction } from "@/lib/actions";
import { formatPrice } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold">Manage Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="section-shell p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{order.user.name}</p>
                <p className="text-xs text-[#6d5741]">
                  {order.user.email} • #{order.id.slice(-8)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <ul className="mt-3 list-disc pl-6 text-sm text-[#5a4734]">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.titleSnapshot} x {item.quantity}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">Total: {formatPrice(Number(order.total))}</p>
              <form action={updateOrderStatusAction} className="flex gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <select
                  name="status"
                  defaultValue={order.status}
                  className="rounded-md border px-3 py-1"
                >
                  {Object.values(OrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button className="rounded-md border px-3 py-1 text-sm">
                  Update
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
