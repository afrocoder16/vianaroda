import { OrderStatus, PaymentMethod, SupplierOrderStatus } from "@prisma/client";

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

export function deriveRetailPrice(cost: number, markupPercent: number) {
  return roundMoney(cost * (1 + markupPercent / 100));
}

export function getShippingLabel(minDays: number, maxDays: number) {
  if (minDays <= 0 && maxDays <= 0) {
    return "Delivery window pending";
  }

  if (minDays === maxDays) {
    return `Delivered in ${maxDays} day${maxDays === 1 ? "" : "s"}`;
  }

  return `Delivered in ${minDays}-${maxDays} days`;
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

const validSupplierTransitions: Record<SupplierOrderStatus, SupplierOrderStatus[]> = {
  DRAFT: ["FORWARDED", "CONFIRMED", "REFUND_REQUESTED"],
  FORWARDED: ["CONFIRMED", "SHIPPED", "REFUND_REQUESTED"],
  CONFIRMED: ["SHIPPED", "REFUND_REQUESTED"],
  SHIPPED: ["DELIVERED", "REFUND_REQUESTED"],
  DELIVERED: ["REFUND_REQUESTED", "REFUNDED"],
  REFUND_REQUESTED: ["REFUNDED"],
  REFUNDED: [],
};

export function canTransitionSupplierStatus(
  from: SupplierOrderStatus,
  to: SupplierOrderStatus,
) {
  return validSupplierTransitions[from].includes(to);
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case PaymentMethod.STRIPE_CARD:
      return "Credit or debit card";
    case PaymentMethod.STRIPE_APPLE_PAY:
      return "Apple Pay";
    case PaymentMethod.STRIPE_GOOGLE_PAY:
      return "Google Pay";
    case PaymentMethod.PAYPAL:
      return "PayPal";
    default:
      return "Card";
  }
}

export function formatPrice(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
