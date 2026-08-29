import { describe, expect, it } from "vitest";

import { assertOrderTransition, canTransitionOrder } from "@/modules/orders/order-state";

describe("order transition policy", () => {
  it("allows only expected operational transitions", () => {
    expect(canTransitionOrder("CREATED", "ACCEPTED")).toBe(true);
    expect(canTransitionOrder("READY", "COMPLETED")).toBe(true);
  });

  it("rejects arbitrary state updates", () => {
    expect(() => assertOrderTransition("CREATED", "COMPLETED")).toThrow(
      "Cannot transition order from CREATED to COMPLETED."
    );
    expect(() => assertOrderTransition("COMPLETED", "CANCELLED")).toThrow();
  });
});
