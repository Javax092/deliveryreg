import { z } from "zod";

import { AppError } from "@/modules/shared/errors/app-error";

export const measurementTypeSchema = z.enum([
  "WEIGHT",
  "UNIT",
  "PACKAGE",
  "VOLUME",
  "BOX"
]);

export type MeasurementType = z.infer<typeof measurementTypeSchema>;

export type BaseUnit = "GRAM" | "UNIT" | "PACKAGE" | "MILLILITER" | "BOX";

export function assertBaseQuantity(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Base quantity must be a positive integer."
    });
  }

  return value;
}

export function grams(value: number): number {
  return assertBaseQuantity(value);
}

export function validateSellingQuantity(input: {
  quantity: number;
  minimumQuantity: number;
  increment: number;
}): number {
  const quantity = assertBaseQuantity(input.quantity);
  const minimumQuantity = assertBaseQuantity(input.minimumQuantity);
  const increment = assertBaseQuantity(input.increment);

  if (quantity < minimumQuantity || quantity % increment !== 0) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Quantity violates minimum or increment rules."
    });
  }

  return quantity;
}
