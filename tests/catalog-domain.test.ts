import { describe, expect, it } from "vitest";

import {
  estimateProductAmount,
  formatCatalogPrice,
  formatQuantity,
  parseCurrencyToCents,
  slugifyProductName,
  validateProductRules,
} from "@/modules/catalog/product-domain";

describe("product domain", () => {
  it("supports required weighted price acceptance examples", () => {
    const base = {
      productId: "product_1",
      productName: "Produto por peso",
      measurementType: "WEIGHT" as const,
      sellingIncrement: 1,
      minimumOrderQuantity: 1,
      priceCents: 4200,
      priceBasisQuantity: 1000,
      priceBasisUnit: "GRAM" as const,
    };

    expect(estimateProductAmount({ ...base, requestedQuantity: 250 })).toBe(
      1050,
    );
    expect(estimateProductAmount({ ...base, requestedQuantity: 500 })).toBe(
      2100,
    );
    expect(estimateProductAmount({ ...base, requestedQuantity: 1000 })).toBe(
      4200,
    );
    expect(estimateProductAmount({ ...base, requestedQuantity: 518 })).toBe(
      2176,
    );
  });

  it("validates generic measurement rules without product-name-specific logic", () => {
    expect(() =>
      validateProductRules({
        name: "Produto por peso",
        slug: "produto-por-peso",
        measurementType: "WEIGHT",
        baseUnit: "UNIT",
        sellingIncrement: 50,
        minimumOrderQuantity: 250,
        priceCents: 4200,
        priceBasisQuantity: 1000,
        priceBasisUnit: "GRAM",
      }),
    ).toThrow("Weighted products must use grams as base unit.");
  });

  it("formats product quantities and prices for pt-BR commerce UI", () => {
    expect(formatQuantity({ measurementType: "WEIGHT", quantity: 500 })).toBe(
      "500 g",
    );
    expect(formatQuantity({ measurementType: "WEIGHT", quantity: 1000 })).toBe(
      "1 kg",
    );
    expect(
      formatCatalogPrice({
        priceCents: 4200,
        basisQuantity: 1000,
        basisUnit: "GRAM",
      }),
    ).toBe("R$ 42,00/kg");
  });

  it("parses admin price text without floating point money", () => {
    expect(parseCurrencyToCents("42,90")).toBe(4290);
    expect(parseCurrencyToCents("42.9")).toBe(4290);
    expect(parseCurrencyToCents("42")).toBe(4200);
    expect(() => parseCurrencyToCents("-1")).toThrow();
  });

  it("generates stable public-safe slugs from product names", () => {
    expect(slugifyProductName("Picanha Premium 500g")).toBe(
      "picanha-premium-500g",
    );
    expect(slugifyProductName("Queijo Coalho – Manaus")).toBe(
      "queijo-coalho-manaus",
    );
  });
});
