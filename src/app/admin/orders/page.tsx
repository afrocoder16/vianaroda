import { OrderStatus, SupplierOrderStatus } from "@prisma/client";
import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  updateOrderFulfillmentAction,
  updateOrderStatusAction,
} from "@/lib/actions";
import { formatPrice, getPaymentMethodLabel } from "@/lib/commerce";
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
          <article key={order.id} className="section-shell space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-xs text-[#475569]">
                  {order.email} • #{order.id.slice(-8)}
                </p>
                <p className="text-xs text-[#475569]">
                  Payment: {getPaymentMethodLabel(order.paymentMethod)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <span className="rounded-full bg-[#e0f2fe] px-2.5 py-1 text-xs font-semibold text-[#0369a1]">
                  {order.supplierOrderStatus}
                </span>
              </div>
            </div>

            <ul className="list-disc pl-6 text-sm text-[#334155]">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.titleSnapshot} x {item.quantity}
                  {item.supplierName ? ` • ${item.supplierName}` : ""}
                </li>
              ))}
            </ul>

            <div className="grid gap-4 xl:grid-cols-[auto_1fr]">
              <form action={updateOrderStatusAction} className="space-y-2">
                <input type="hidden" name="orderId" value={order.id} />
                <p className="text-sm font-semibold">Customer-facing status</p>
                <select
                  name="status"
                  defaultValue={order.status}
                  className="rounded-md border px-3 py-2"
                >
                  {Object.values(OrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button className="block rounded-md border px-3 py-2 text-sm">
                  Update status
                </button>
              </form>

              <form action={updateOrderFulfillmentAction} className="grid gap-3">
                <input type="hidden" name="orderId" value={order.id} />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <select
                    name="supplierOrderStatus"
                    defaultValue={order.supplierOrderStatus}
                    className="rounded-md border px-3 py-2"
                  >
                    {Object.values(SupplierOrderStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <input
                    name="supplierReference"
                    defaultValue={order.supplierReference ?? ""}
                    placeholder="Supplier reference"
                    className="rounded-md border px-3 py-2"
                  />
                  <input
                    name="trackingNumber"
                    defaultValue={order.trackingNumber ?? ""}
                    placeholder="Tracking number"
                    className="rounded-md border px-3 py-2"
                  />
                  <input
                    name="trackingUrl"
                    defaultValue={order.trackingUrl ?? ""}
                    placeholder="Tracking URL"
                    className="rounded-md border px-3 py-2"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                  <input
                    name="estimatedDelivery"
                    defaultValue={order.estimatedDelivery ?? ""}
                    placeholder="Estimated delivery"
                    className="rounded-md border px-3 py-2"
                  />
                  <input
                    name="fulfillmentNotes"
                    defaultValue={order.fulfillmentNotes ?? ""}
                    placeholder="Fulfillment notes"
                    className="rounded-md border px-3 py-2"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[#475569]">
                    Total: {formatPrice(Number(order.total))} • Supplier:{" "}
                    {order.supplierSummary ?? "Unassigned"}
                  </p>
                  <button className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">
                    Update fulfillment
                  </button>
                </div>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
