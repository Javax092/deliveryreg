import { describe, expect, it } from "vitest";

import {
  affectsPhysicalCash,
  calculateDifferenceCents,
  calculateExpectedCashCents,
  movementSignedAmount,
  parseMoneyInput,
  validateCashMovementReason,
  validateClosingNote
} from "@/modules/cash/calculations";

describe("cash domain", () => {
  it("parses Brazilian money input into integer cents", () => {
    expect(parseMoneyInput("0,00")).toBe(0);
    expect(parseMoneyInput("200")).toBe(20000);
    expect(parseMoneyInput("1.250,50")).toBe(125050);
    expect(() => parseMoneyInput("-1,00")).toThrow();
    expect(() => parseMoneyInput("12.34")).toThrow();
  });

  it("keeps only cash payments in physical cash", () => {
    expect(affectsPhysicalCash("CASH")).toBe(true);
    expect(affectsPhysicalCash("PIX")).toBe(false);
    expect(affectsPhysicalCash("DEBIT_CARD")).toBe(false);
    expect(affectsPhysicalCash("CREDIT_CARD")).toBe(false);
  });

  it("calculates expected cash from opening, cash payments, supplies and withdrawals", () => {
    expect(
      calculateExpectedCashCents({
        openingAmountCents: 20000,
        cashPaymentsCents: 4000,
        suppliesCents: 10000,
        withdrawalsCents: 3000
      })
    ).toBe(31000);
  });

  it("calculates positive, negative and zero differences", () => {
    expect(calculateDifferenceCents({ countedCashCents: 31000, expectedCashCents: 31000 })).toBe(0);
    expect(calculateDifferenceCents({ countedCashCents: 31500, expectedCashCents: 31000 })).toBe(500);
    expect(calculateDifferenceCents({ countedCashCents: 30500, expectedCashCents: 31000 })).toBe(-500);
  });

  it("validates movement signs and reasons", () => {
    expect(movementSignedAmount({ type: "SUPPLY", amountCents: 1000 })).toBe(1000);
    expect(movementSignedAmount({ type: "WITHDRAWAL", amountCents: 1000 })).toBe(-1000);
    expect(validateCashMovementReason("Troco adicional")).toBe("Troco adicional");
    expect(() => validateCashMovementReason("x")).toThrow();
  });

  it("requires note only when closing has divergence", () => {
    expect(validateClosingNote({ differenceCents: 0, note: "" })).toBeNull();
    expect(validateClosingNote({ differenceCents: -500, note: "Faltou troco" })).toBe("Faltou troco");
    expect(() => validateClosingNote({ differenceCents: 500, note: "" })).toThrow();
  });
});
