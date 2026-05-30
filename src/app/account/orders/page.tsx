import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPrice, getPaymentMethodLabel } from "@/lib/commerce";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold">Order History</h1>
        <Link href="/account" className="text-sm font-semibold text-[var(--brand)]">
          Account overview
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="section-shell p-8 text-center text-[#475569]">
          No orders yet.
        </div>
      ) : (
        orders.map((order) => (
          <article key={order.id} className="section-shell space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#475569]">Order #{order.id.slice(-8)}</p>
                <p className="text-sm text-[#475569]">
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
                  {item.shippingLabel ? ` • ${item.shippingLabel}` : ""}
                </li>
              ))}
            </ul>

            <div className="grid gap-3 rounded-2xl border border-[#d6dde7] p-4 text-sm text-[#334155] md:grid-cols-2">
              <div>
                <p className="font-semibold">Tracking</p>
                <p>{order.trackingNumber ?? "Pending supplier tracking scan"}</p>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--brand)]"
                  >
                    Open tracking link
                  </a>
                ) : null}
              </div>
              <div>
                <p className="font-semibold">Delivery estimate</p>
                <p>{order.estimatedDelivery ?? "Pending"}</p>
                <p>Supplier: {order.supplierSummary ?? "Unassigned"}</p>
              </div>
            </div>

            <p className="font-semibold">Total: {formatPrice(Number(order.total))}</p>
          </article>
        ))
      )}
    </div>
  );
}
