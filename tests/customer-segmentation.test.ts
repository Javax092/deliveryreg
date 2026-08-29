import { describe, expect, it } from "vitest";

import {
  averagePurchaseFrequencyDays,
  segmentCustomer
} from "@/modules/crm/segmentation";

const now = new Date("2026-08-15T12:00:00.000Z");

describe("customer segmentation", () => {
  it("marks customers without completed purchases as new", () => {
    expect(
      segmentCustomer({
        completedOrderCount: 0,
        lastPurchaseAt: null,
        now
      })
    ).toBe("NEW");
  });

  it("distinguishes active, recurring, at risk and inactive customers", () => {
    expect(
      segmentCustomer({
        completedOrderCount: 1,
        lastPurchaseAt: new Date("2026-08-01T12:00:00.000Z"),
        now
      })
    ).toBe("ACTIVE");

    expect(
      segmentCustomer({
        completedOrderCount: 2,
        lastPurchaseAt: new Date("2026-08-01T12:00:00.000Z"),
        now
      })
    ).toBe("RECURRING");

    expect(
      segmentCustomer({
        completedOrderCount: 2,
        lastPurchaseAt: new Date("2026-06-01T12:00:00.000Z"),
        now
      })
    ).toBe("AT_RISK");

    expect(
      segmentCustomer({
        completedOrderCount: 2,
        lastPurchaseAt: new Date("2026-01-01T12:00:00.000Z"),
        now
      })
    ).toBe("INACTIVE");
  });

  it("does not fabricate purchase frequency with insufficient history", () => {
    expect(averagePurchaseFrequencyDays([new Date("2026-08-01")])).toBeNull();
    expect(
      averagePurchaseFrequencyDays([
        new Date("2026-08-01"),
        new Date("2026-08-08"),
        new Date("2026-08-15")
      ])
    ).toBe(7);
  });
});
