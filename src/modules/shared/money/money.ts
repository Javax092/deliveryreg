import { AppError } from "@/modules/shared/errors/app-error";

export type MoneyCents = number;

export function assertMoneyCents(value: number): MoneyCents {
  if (!Number.isInteger(value) || value < 0) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Money must be a non-negative integer amount of cents."
    });
  }

  return value;
}

export function calculateProportionalAmountCents(input: {
  priceCents: MoneyCents;
  basisQuantity: number;
  quantity: number;
}): MoneyCents {
  assertMoneyCents(input.priceCents);

  if (
    !Number.isInteger(input.basisQuantity) ||
    input.basisQuantity <= 0 ||
    !Number.isInteger(input.quantity) ||
    input.quantity <= 0
  ) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Quantity and basis quantity must be positive integers."
    });
  }

  return Math.round((input.priceCents * input.quantity) / input.basisQuantity);
}

export function formatBRL(cents: MoneyCents): string {
  assertMoneyCents(cents);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}
