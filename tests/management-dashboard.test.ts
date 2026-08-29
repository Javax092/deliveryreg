import { describe, expect, it } from "vitest";

import {
  calculateAverageTicketCents,
  calculateTrend,
  formatSoldQuantity,
  resolveManagementPeriod
} from "@/modules/management/dashboard";

describe("management dashboard helpers", () => {
  it("calculates average ticket only for completed sales", () => {
    expect(calculateAverageTicketCents({ revenueCents: 0, completedOrders: 0 })).toBeNull();
    expect(calculateAverageTicketCents({ revenueCents: 2500, completedOrders: 1 })).toBe(2500);
    expect(calculateAverageTicketCents({ revenueCents: 10001, completedOrders: 3 })).toBe(3334);
  });

  it("does not show misleading comparison when previous period is zero", () => {
    expect(calculateTrend({ currentCents: 5000, previousCents: 0 })).toMatchObject({
      percent: null,
      label: "Sem base anterior"
    });
  });

  it("calculates same-duration previous period", () => {
    const trend = calculateTrend({ currentCents: 1134, previousCents: 1000 });
    expect(trend.percent).toBeCloseTo(13.4);
    expect(trend.label).toBe("+13,4% vs periodo anterior");
  });

  it("resolves business-day bounds in America/Manaus", () => {
    const period = resolveManagementPeriod({
      preset: "today",
      now: new Date("2026-08-26T12:00:00.000Z")
    });

    expect(period.from.toISOString()).toBe("2026-08-26T04:00:00.000Z");
    expect(period.to.toISOString()).toBe("2026-08-27T04:00:00.000Z");
    expect(period.previousFrom.toISOString()).toBe("2026-08-25T04:00:00.000Z");
    expect(period.previousTo.toISOString()).toBe("2026-08-26T04:00:00.000Z");
  });

  it("formats sold quantities with product semantics", () => {
    expect(formatSoldQuantity({ measurementType: "WEIGHT", quantity: 18400 })).toBe("18,400 kg");
    expect(formatSoldQuantity({ measurementType: "UNIT", quantity: 18 })).toBe("18 un.");
    expect(formatSoldQuantity({ measurementType: "PACKAGE", quantity: 4 })).toBe("4 pac.");
  });
});
