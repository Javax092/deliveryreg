import { describe, expect, it } from "vitest";

import {
  assertSufficientInventory,
  assertStockMovement,
  buildTransferMovements,
  calculateAvailableQuantity,
  summarizeInventory
} from "@/modules/inventory/ledger";
import { hashRequestPayload } from "@/modules/shared/idempotency";

describe("inventory ledger and idempotency foundations", () => {
  it("calculates stock from immutable movements", () => {
    expect(
      calculateAvailableQuantity([
        { type: "PURCHASE", quantityDelta: 1000 },
        { type: "SALE", quantityDelta: -250 },
        { type: "LOSS", quantityDelta: -50 },
        { type: "RETURN", quantityDelta: 100 }
      ])
    ).toBe(800);
  });

  it("rejects movement directions that would corrupt the ledger", () => {
    expect(() => assertStockMovement({ type: "SALE", quantityDelta: 100 })).toThrow(
      "Sale and loss movements must reduce stock."
    );
  });

  it("blocks inventory conflicts before sale movement creation", () => {
    expect(() => assertSufficientInventory(100, 101)).toThrow(
      "Insufficient inventory for movement."
    );
  });

  it("hashes duplicate critical requests consistently", () => {
    const payload = { orderId: "order_1", userId: "user_1" };
    expect(hashRequestPayload(payload)).toBe(hashRequestPayload(payload));
    expect(hashRequestPayload(payload)).not.toBe(
      hashRequestPayload({ orderId: "order_2", userId: "user_1" })
    );
  });

  it("summarizes inventory answers required by operation", () => {
    const summary = summarizeInventory([
      { type: "PURCHASE", quantityDelta: 1000 },
      { type: "SALE", quantityDelta: -250 },
      { type: "LOSS", quantityDelta: -50 },
      { type: "TRANSFER", quantityDelta: -100 },
      { type: "TRANSFER", quantityDelta: 40 },
      { type: "ADJUSTMENT", quantityDelta: 10 },
      { type: "RETURN", quantityDelta: 20 }
    ]);

    expect(summary.purchased).toBe(1000);
    expect(summary.sold).toBe(250);
    expect(summary.lost).toBe(50);
    expect(summary.transferredOut).toBe(100);
    expect(summary.transferredIn).toBe(40);
    expect(summary.adjusted).toBe(10);
    expect(summary.returned).toBe(20);
    expect(summary.current).toBe(670);
  });

  it("builds atomic transfer movement pairs without creating stock", () => {
    const transfer = buildTransferMovements(250);

    expect(transfer.debit.quantityDelta + transfer.credit.quantityDelta).toBe(0);
    expect(transfer.debit.type).toBe("TRANSFER");
    expect(transfer.credit.type).toBe("TRANSFER");
  });
});
