import { describe, expect, it } from "vitest";

import { calculateProportionalAmountCents } from "@/modules/shared/money/money";
import { priceOrderItem } from "@/modules/orders/pricing";

describe("money and weighted pricing", () => {
  it("calculates required weighted examples in cents", () => {
    expect(
      calculateProportionalAmountCents({
        priceCents: 4200,
        basisQuantity: 1000,
        quantity: 250,
      }),
    ).toBe(1050);

    expect(
      calculateProportionalAmountCents({
        priceCents: 4200,
        basisQuantity: 1000,
        quantity: 500,
      }),
    ).toBe(2100);

    expect(
      calculateProportionalAmountCents({
        priceCents: 4200,
        basisQuantity: 1000,
        quantity: 1000,
      }),
    ).toBe(4200);
  });

  it("preserves requested and actual quantities for weighted items", () => {
    const item = priceOrderItem({
      productId: "product_1",
      productName: "Produto por peso",
      measurementType: "WEIGHT",
      requestedQuantity: 500,
      actualQuantity: 518,
      sellingIncrement: 1,
      minimumOrderQuantity: 1,
      priceCents: 4200,
      priceBasisQuantity: 1000,
      priceBasisUnit: "GRAM",
    });

    expect(item.requestedQuantity).toBe(500);
    expect(item.actualQuantity).toBe(518);
    expect(item.estimatedAmountCents).toBe(2100);
    expect(item.finalAmountCents).toBe(2100);
  });

  it("rejects invalid quantity", () => {
    expect(() =>
      priceOrderItem({
        productId: "product_1",
        productName: "Produto por peso",
        measurementType: "WEIGHT",
        requestedQuantity: 0,
        sellingIncrement: 1,
        minimumOrderQuantity: 1,
        priceCents: 4200,
        priceBasisQuantity: 1000,
        priceBasisUnit: "GRAM",
      }),
    ).toThrow("Base quantity must be a positive integer.");
  });

  it("rounds deterministically at cent boundaries", () => {
    expect(
      calculateProportionalAmountCents({
        priceCents: 999,
        basisQuantity: 1000,
        quantity: 333,
      }),
    ).toBe(333);
  });
});
