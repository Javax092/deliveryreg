import { describe, expect, it, vi } from "vitest";

import {
  getProductAdminValidationMessage,
  parseProductAdminForm
} from "@/modules/catalog/admin-service";

describe("product admin form parser", () => {
  it("reports a specific price validation error for an edit payload without current price", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const formData = new FormData();

    formData.set("productId", "cmteoagr7001lfdd6xqzf48ke");
    formData.set("name", "Goma de tapioca");
    formData.set("description", "");
    formData.set("categoryId", "cmteoa2rr000ffdd67hm56864");
    formData.set("imageUrl", "");
    formData.set("measurementType", "PACKAGE");
    formData.set("price", "");
    formData.set("minimumOrderQuantity", "1");
    formData.set("sellingIncrement", "1");
    formData.set("isActive", "on");
    formData.append("availableBranchIds", "cmteo9use0003fdd6wpv50lfq");
    formData.append("availableBranchIds", "cmteo9tlw0001fdd6fdutyrsz");

    let error: unknown;
    try {
      parseProductAdminForm(formData);
    } catch (caught) {
      error = caught;
    }

    expect(getProductAdminValidationMessage(error)).toBe("Informe um preço válido.");
    warn.mockRestore();
  });

  it("parses browser form strings into the admin product input shape", () => {
    const formData = new FormData();

    formData.set("name", "Produto simples");
    formData.set("description", "");
    formData.set("categoryId", "category_1");
    formData.set("imageUrl", "");
    formData.set("measurementType", "UNIT");
    formData.set("price", "42,00");
    formData.set("minimumOrderQuantity", "1");
    formData.set("sellingIncrement", "1");
    formData.set("isActive", "on");
    formData.append("availableBranchIds", "branch_1");
    formData.append("availableBranchIds", "branch_2");

    expect(parseProductAdminForm(formData)).toMatchObject({
      name: "Produto simples",
      price: "42,00",
      minimumOrderQuantity: 1,
      sellingIncrement: 1,
      isActive: true,
      availableBranchIds: ["branch_1", "branch_2"]
    });
  });

  it("accepts HTTPS image URLs and local public asset paths", () => {
    const httpsFormData = buildValidProductFormData("https://example.com/produto.jpg");
    const localFormData = buildValidProductFormData("/queijoqualho.png");

    expect(parseProductAdminForm(httpsFormData).imageUrl).toBe("https://example.com/produto.jpg");
    expect(parseProductAdminForm(localFormData).imageUrl).toBe("/queijoqualho.png");
  });

  it("rejects HTTP, Base64 data URLs, and protocol-relative image URLs", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    for (const imageUrl of [
      "http://example.com/produto.jpg",
      "data:image/png;base64,abc",
      "//example.com/produto.jpg"
    ]) {
      let error: unknown;
      try {
        parseProductAdminForm(buildValidProductFormData(imageUrl));
      } catch (caught) {
        error = caught;
      }

      expect(getProductAdminValidationMessage(error)).toBe(
        "Informe uma URL HTTPS pública da imagem."
      );
    }

    warn.mockRestore();
  });
});

function buildValidProductFormData(imageUrl: string) {
  const formData = new FormData();

  formData.set("name", "Produto simples");
  formData.set("description", "");
  formData.set("categoryId", "category_1");
  formData.set("imageUrl", imageUrl);
  formData.set("measurementType", "UNIT");
  formData.set("price", "42,00");
  formData.set("minimumOrderQuantity", "1");
  formData.set("sellingIncrement", "1");
  formData.set("isActive", "on");
  formData.append("availableBranchIds", "branch_1");

  return formData;
}
