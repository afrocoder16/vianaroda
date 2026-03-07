import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPrice } from "@/lib/commerce";
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
      <h1 className="font-serif text-3xl font-bold">Order History</h1>
      {orders.length === 0 ? (
        <div className="section-shell p-8 text-center text-[#6e5841]">
          No orders yet.
        </div>
      ) : (
        orders.map((order) => (
          <article key={order.id} className="section-shell space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#725d47]">Order #{order.id.slice(-8)}</p>
              <OrderStatusBadge status={order.status} />
            </div>
            <ul className="list-disc pl-6 text-sm text-[#4f3d2c]">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.titleSnapshot} x {item.quantity}
                </li>
              ))}
            </ul>
            <p className="font-semibold">Total: {formatPrice(Number(order.total))}</p>
          </article>
        ))
      )}
    </div>
  );
}
