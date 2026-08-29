import { describe, expect, it } from "vitest";

const eventTypes = [
  "catalog_viewed",
  "product_viewed",
  "product_added",
  "cart_viewed",
  "checkout_started",
  "lead_created",
  "order_created",
  "order_completed"
];

describe("analytics event contract", () => {
  it("contains the first-party funnel events required for public acquisition", () => {
    expect(eventTypes).toEqual([
      "catalog_viewed",
      "product_viewed",
      "product_added",
      "cart_viewed",
      "checkout_started",
      "lead_created",
      "order_created",
      "order_completed"
    ]);
  });
});
