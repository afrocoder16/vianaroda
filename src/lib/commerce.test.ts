import { OrderStatus } from "@prisma/client";
import {
  calculateOrderTotals,
  canTransitionOrderStatus,
  roundMoney,
} from "@/lib/commerce";

describe("commerce helpers", () => {
  it("calculates totals with tax and shipping", () => {
    const totals = calculateOrderTotals([
      { quantity: 2, unitPrice: 20 },
      { quantity: 1, unitPrice: 10 },
    ]);

    expect(totals.subtotal).toBe(50);
    expect(totals.shipping).toBe(9.99);
    expect(totals.tax).toBe(4);
    expect(totals.total).toBe(63.99);
  });

  it("applies free shipping threshold", () => {
    const totals = calculateOrderTotals([{ quantity: 2, unitPrice: 80 }]);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(172.8);
  });

  it("validates status transitions", () => {
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.PAID)).toBe(
      true,
    );
    expect(
      canTransitionOrderStatus(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
    ).toBe(false);
  });

  it("rounds money safely", () => {
    expect(roundMoney(10.555)).toBe(10.56);
    expect(roundMoney(10.554)).toBe(10.55);
  });
});
