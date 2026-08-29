import {
  estimateProductAmount,
  formatQuantity,
  type ProductInput,
} from "@/modules/catalog/product-domain";

export const PUBLIC_CART_STORAGE_KEY = "deliveryreg_cart";

export type PublicCartItem = {
  productId: string;
  productName: string;
  sourceCode?: string;
  measurementType: ProductInput["measurementType"];
  requestedQuantity: number;
  estimatedAmountCents: number;
  priceCents: number;
  basisQuantity: number;
  basisUnit: ProductInput["priceBasisUnit"];
  sellingIncrement: number;
  minimumOrderQuantity: number;
};

export function estimateCartItemAmount(input: {
  productId: string;
  productName: string;
  measurementType: ProductInput["measurementType"];
  requestedQuantity: number;
  sellingIncrement: number;
  minimumOrderQuantity: number;
  priceCents: number;
  basisQuantity: number;
  basisUnit: ProductInput["priceBasisUnit"];
}) {
  return estimateProductAmount({
    productId: input.productId,
    productName: input.productName,
    measurementType: input.measurementType,
    requestedQuantity: input.requestedQuantity,
    sellingIncrement: input.sellingIncrement,
    minimumOrderQuantity: input.minimumOrderQuantity,
    priceCents: input.priceCents,
    priceBasisQuantity: input.basisQuantity,
    priceBasisUnit: input.basisUnit,
  });
}

export function buildCartItem(input: Omit<PublicCartItem, "estimatedAmountCents">): PublicCartItem {
  return {
    ...input,
    estimatedAmountCents: estimateCartItemAmount(input),
  };
}

export function parsePublicCart(raw: string | null): PublicCartItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const candidate = item as Partial<PublicCartItem>;
      const measurementType = candidate.measurementType;

      if (
        typeof candidate.productId !== "string" ||
        typeof candidate.productName !== "string" ||
        !isMeasurementType(measurementType) ||
        !isPositiveInteger(candidate.requestedQuantity) ||
        !isNonNegativeInteger(candidate.priceCents) ||
        !isPositiveInteger(candidate.basisQuantity)
      ) {
        return [];
      }

      const minimumOrderQuantity = isPositiveInteger(candidate.minimumOrderQuantity)
        ? candidate.minimumOrderQuantity
        : candidate.requestedQuantity;
      const sellingIncrement = isPositiveInteger(candidate.sellingIncrement)
        ? candidate.sellingIncrement
        : inferLegacyIncrement(measurementType, minimumOrderQuantity);
      const requestedQuantity = normalizeRequestedQuantity({
        quantity: candidate.requestedQuantity,
        minimumOrderQuantity,
        sellingIncrement,
      });

      return [
        buildCartItem({
          productId: candidate.productId,
          productName: candidate.productName,
          sourceCode: typeof candidate.sourceCode === "string" ? candidate.sourceCode : undefined,
          measurementType,
          requestedQuantity,
          priceCents: candidate.priceCents,
          basisQuantity: candidate.basisQuantity,
          basisUnit: isBasisUnit(candidate.basisUnit)
            ? candidate.basisUnit
            : unitForMeasurement(measurementType),
          sellingIncrement,
          minimumOrderQuantity,
        }),
      ];
    });
  } catch {
    return [];
  }
}

export function readPublicCart(): PublicCartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parsePublicCart(window.localStorage.getItem(PUBLIC_CART_STORAGE_KEY));
}

export function writePublicCart(items: PublicCartItem[]) {
  window.localStorage.setItem(PUBLIC_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("deliveryreg-cart-updated"));
}

export function removePublicCart() {
  window.localStorage.removeItem(PUBLIC_CART_STORAGE_KEY);
  window.dispatchEvent(new Event("deliveryreg-cart-updated"));
}

export function normalizeRequestedQuantity(input: {
  quantity: number;
  minimumOrderQuantity: number;
  sellingIncrement: number;
}) {
  if (input.quantity <= input.minimumOrderQuantity) {
    return input.minimumOrderQuantity;
  }

  const remainder = input.quantity % input.sellingIncrement;
  return remainder === 0 ? input.quantity : input.quantity + input.sellingIncrement - remainder;
}

export function getNextQuantity(item: PublicCartItem, direction: "decrease" | "increase") {
  if (direction === "increase") {
    return item.requestedQuantity + item.sellingIncrement;
  }

  return Math.max(item.minimumOrderQuantity, item.requestedQuantity - item.sellingIncrement);
}

export function formatCartQuantity(item: Pick<PublicCartItem, "measurementType" | "requestedQuantity">) {
  return formatQuantity({
    measurementType: item.measurementType,
    quantity: item.requestedQuantity,
  });
}

function inferLegacyIncrement(
  measurementType: ProductInput["measurementType"],
  minimumOrderQuantity: number,
) {
  if (measurementType === "WEIGHT" || measurementType === "VOLUME") {
    return minimumOrderQuantity;
  }

  return 1;
}

function unitForMeasurement(
  measurementType: ProductInput["measurementType"],
): ProductInput["priceBasisUnit"] {
  if (measurementType === "WEIGHT") {
    return "GRAM";
  }

  if (measurementType === "VOLUME") {
    return "MILLILITER";
  }

  if (measurementType === "PACKAGE") {
    return "PACKAGE";
  }

  if (measurementType === "BOX") {
    return "BOX";
  }

  return "UNIT";
}

function isMeasurementType(value: unknown): value is ProductInput["measurementType"] {
  return (
    value === "WEIGHT" ||
    value === "UNIT" ||
    value === "PACKAGE" ||
    value === "VOLUME" ||
    value === "BOX"
  );
}

function isBasisUnit(value: unknown): value is ProductInput["priceBasisUnit"] {
  return (
    value === "GRAM" ||
    value === "UNIT" ||
    value === "PACKAGE" ||
    value === "MILLILITER" ||
    value === "BOX"
  );
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}
