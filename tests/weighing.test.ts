import { describe, expect, it } from "vitest";

import {
  assertCanConfirmActualQuantity,
  calculateFinalAmountFromActualQuantity,
} from "@/modules/orders/weighing";

describe("store weighing operation", () => {
  it("calculates final amount from explicit actual weight", () => {
    expect(
      calculateFinalAmountFromActualQuantity({
        actualQuantity: 518,
        priceCents: 4200,
        priceBasisQuantity: 1000,
      }),
    ).toBe(2176);
  });

  it("preserves requested quantity by only validating actual quantity separately", () => {
    expect(
      assertCanConfirmActualQuantity({
        currentActualQuantity: null,
        actualQuantity: 518,
      }),
    ).toBe(518);
  });

  it("blocks repeated weight confirmation", () => {
    expect(() =>
      assertCanConfirmActualQuantity({
        currentActualQuantity: 518,
        actualQuantity: 520,
      }),
    ).toThrow("Actual quantity has already been confirmed.");
  });
});
