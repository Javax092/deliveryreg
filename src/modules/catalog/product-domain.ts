import { z } from "zod";

import { priceOrderItem } from "@/modules/orders/pricing";
import { AppError } from "@/modules/shared/errors/app-error";
import { formatBRL } from "@/modules/shared/money/money";
import { measurementTypeSchema, validateSellingQuantity } from "@/modules/shared/quantity/measurement";

export const productInputSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().optional(),
  measurementType: measurementTypeSchema,
  baseUnit: z.enum(["GRAM", "UNIT", "PACKAGE", "MILLILITER", "BOX"]),
  sellingIncrement: z.number().int().positive(),
  minimumOrderQuantity: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  priceBasisQuantity: z.number().int().positive(),
  priceBasisUnit: z.enum(["GRAM", "UNIT", "PACKAGE", "MILLILITER", "BOX"])
});

export type ProductInput = z.infer<typeof productInputSchema>;

export function slugifyProductName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseCurrencyToCents(value: string): number {
  const normalized = value.trim().replace(/\s+/g, "");

  if (!/^\d+(?:[,.]\d{1,2})?$/.test(normalized)) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Invalid currency amount."
    });
  }

  const [reais, cents = ""] = normalized.replace(",", ".").split(".");
  const centavos = cents.padEnd(2, "0");

  return Number(`${reais}${centavos}`);
}

export function formatCentsForInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function validateProductRules(input: ProductInput): ProductInput {
  const product = productInputSchema.parse(input);

  validateSellingQuantity({
    quantity: product.minimumOrderQuantity,
    minimumQuantity: product.minimumOrderQuantity,
    increment: product.sellingIncrement
  });

  if (product.measurementType === "WEIGHT" && product.baseUnit !== "GRAM") {
    throw new AppError("VALIDATION_ERROR", {
      message: "Weighted products must use grams as base unit."
    });
  }

  if (product.measurementType === "VOLUME" && product.baseUnit !== "MILLILITER") {
    throw new AppError("VALIDATION_ERROR", {
      message: "Volume products must use milliliters as base unit."
    });
  }

  if (product.measurementType === "UNIT" && product.baseUnit !== "UNIT") {
    throw new AppError("VALIDATION_ERROR", {
      message: "Unit products must use unit as base unit."
    });
  }

  return product;
}

export function estimateProductAmount(input: {
  productId: string;
  productName: string;
  measurementType: ProductInput["measurementType"];
  requestedQuantity: number;
  sellingIncrement: number;
  minimumOrderQuantity: number;
  priceCents: number;
  priceBasisQuantity: number;
  priceBasisUnit: ProductInput["priceBasisUnit"];
}) {
  return priceOrderItem(input).estimatedAmountCents;
}

export function formatQuantity(input: {
  measurementType: ProductInput["measurementType"];
  quantity: number;
}): string {
  if (input.measurementType === "WEIGHT") {
    if (input.quantity >= 1000 && input.quantity % 1000 === 0) {
      return `${input.quantity / 1000} kg`;
    }

    return `${input.quantity} g`;
  }

  if (input.measurementType === "VOLUME") {
    return `${input.quantity} ml`;
  }

  return `${input.quantity} un.`;
}

export function formatCatalogPrice(input: {
  priceCents: number;
  basisQuantity: number;
  basisUnit: ProductInput["priceBasisUnit"];
}): string {
  const unitLabel = {
    GRAM: input.basisQuantity === 1000 ? "kg" : "g",
    UNIT: "un.",
    PACKAGE: "pacote",
    MILLILITER: input.basisQuantity === 1000 ? "l" : "ml",
    BOX: "caixa"
  }[input.basisUnit];

  return `${formatBRL(input.priceCents)}/${unitLabel}`;
}
