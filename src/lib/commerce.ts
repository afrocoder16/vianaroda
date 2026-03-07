import { OrderStatus } from "@prisma/client";

export type CartCalcItem = {
  quantity: number;
  unitPrice: number;
};

export function calculateOrderTotals(items: CartCalcItem[]) {
  const subtotal = items.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0,
  );
  const shipping = subtotal <= 0 ? 0 : subtotal > 150 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return {
    subtotal: roundMoney(subtotal),
    shipping: roundMoney(shipping),
    tax: roundMoney(tax),
    total: roundMoney(total),
  };
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "SHIPPED", "DELIVERED", "CANCELLED"],
  PAID: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
) {
  return validTransitions[from].includes(to);
}

export function formatPrice(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
