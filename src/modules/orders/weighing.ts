import { calculateProportionalAmountCents } from "@/modules/shared/money/money";
import { assertBaseQuantity } from "@/modules/shared/quantity/measurement";
import { AppError } from "@/modules/shared/errors/app-error";

export function assertCanConfirmActualQuantity(input: {
  currentActualQuantity: number | null;
  actualQuantity: number;
}): number {
  if (input.currentActualQuantity !== null) {
    throw new AppError("CONFLICT", {
      message: "Actual quantity has already been confirmed."
    });
  }

  return assertBaseQuantity(input.actualQuantity);
}

export function calculateFinalAmountFromActualQuantity(input: {
  actualQuantity: number;
  priceCents: number;
  priceBasisQuantity: number;
}): number {
  return calculateProportionalAmountCents({
    priceCents: input.priceCents,
    basisQuantity: input.priceBasisQuantity,
    quantity: input.actualQuantity
  });
}
