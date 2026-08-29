import type { CashMovementType, PaymentMethod } from "@prisma/client";

import { assertMoneyCents } from "@/modules/shared/money/money";
import { AppError } from "@/modules/shared/errors/app-error";

export function parseMoneyInput(value: FormDataEntryValue | null): number {
  const raw = String(value ?? "").trim();

  if (!raw) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Money value is required."
    });
  }

  const normalized = raw.replace(/\s/g, "");

  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(normalized)) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Money value must use Brazilian decimal format."
    });
  }

  const [reaisPart, centsPart = ""] = normalized.replace(/\./g, "").split(",");
  const cents = Number(`${reaisPart}${centsPart.padEnd(2, "0")}`);

  return assertMoneyCents(cents);
}

export function assertPositiveMoneyCents(value: number): number {
  assertMoneyCents(value);

  if (value <= 0) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Amount must be greater than zero."
    });
  }

  return value;
}

export function validateCashMovementReason(reason: string): string {
  const normalized = reason.trim();

  if (normalized.length < 3 || normalized.length > 180) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Movement reason must have between 3 and 180 characters."
    });
  }

  return normalized;
}

export function validateClosingNote(input: {
  differenceCents: number;
  note?: string | null;
}): string | null {
  const normalized = input.note?.trim() ?? "";

  if (input.differenceCents === 0) {
    return normalized || null;
  }

  if (normalized.length < 5 || normalized.length > 240) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Divergent closing requires a note between 5 and 240 characters."
    });
  }

  return normalized;
}

export function affectsPhysicalCash(method: PaymentMethod): boolean {
  return method === "CASH";
}

export function calculateExpectedCashCents(input: {
  openingAmountCents: number;
  cashPaymentsCents: number;
  suppliesCents: number;
  withdrawalsCents: number;
}): number {
  return assertMoneyCents(
    input.openingAmountCents + input.cashPaymentsCents + input.suppliesCents - input.withdrawalsCents
  );
}

export function calculateDifferenceCents(input: {
  countedCashCents: number;
  expectedCashCents: number;
}): number {
  assertMoneyCents(input.countedCashCents);
  assertMoneyCents(input.expectedCashCents);

  return input.countedCashCents - input.expectedCashCents;
}

export function movementSignedAmount(input: {
  type: CashMovementType;
  amountCents: number;
}): number {
  assertPositiveMoneyCents(input.amountCents);
  return input.type === "SUPPLY" ? input.amountCents : -input.amountCents;
}
