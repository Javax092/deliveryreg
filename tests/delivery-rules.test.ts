import { describe, expect, it } from "vitest";

import {
  assertDeliveryMinimum,
  buildMapsDestination,
  normalizeDeliveryZoneName
} from "@/modules/delivery/rules";

describe("delivery pilot rules", () => {
  it("normalizes delivery zones safely", () => {
    expect(normalizeDeliveryZoneName("Ponta Negra")).toBe("ponta-negra");
    expect(normalizeDeliveryZoneName("Adrianópolis")).toBe("adrianopolis");
  });

  it("enforces minimum order for delivery", () => {
    expect(() =>
      assertDeliveryMinimum({
        subtotalCents: 2999,
        minimumOrderCents: 3000
      })
    ).toThrow("Order subtotal is below delivery minimum.");
  });

  it("builds external maps destination links", () => {
    expect(
      buildMapsDestination({
        street: "Av. Brasil",
        number: "100",
        neighborhood: "Compensa"
      })
    ).toContain("google.com/maps/search");
  });
});
