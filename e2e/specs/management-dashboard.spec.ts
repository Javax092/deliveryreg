import { expect, test } from "@playwright/test";

import { e2e, login } from "../fixtures";

test.describe("dashboard gerencial", () => {
  test("OWNER visualiza gestao por periodo, produtos, pagamentos e filtro de filial", async ({ page }) => {
    await login(page, e2e.users.ownerA);

    await expect(page.getByRole("heading", { name: "Painel operacional" })).toBeVisible();
    await expect(page.getByText("Vendas reconhecidas")).toBeVisible();
    await page.getByRole("link", { name: "Abrir gestão" }).click();

    await expect(page.getByRole("heading", { name: "Gestão" })).toBeVisible();
    await page.locator('select[name="period"]').selectOption("custom");
    await page.locator('input[name="from"]').fill("2026-08-26");
    await page.locator('input[name="to"]').fill("2026-08-26");
    await page.locator('select[name="branchId"]').selectOption("e2e_branch_a2");
    await page.getByRole("button", { name: "Aplicar" }).click();

    await expect(page.getByText("R$ 24,00").first()).toBeVisible();
    await expect(page.getByText(/E2E Produto unitario/)).toBeVisible();
    await expect(page.getByText("2 un.")).toBeVisible();
    await expect(page.getByText("Dinheiro (1)")).toBeVisible();
    await expect(page.getByText("E2E Filial A2 (1)")).toBeVisible();
    await expect(page.getByText("E2E Filial A1 (1)")).toHaveCount(0);
    await expect(page.getByText("E2E Produto exclusivo B")).toHaveCount(0);

    await page.locator('select[name="branchId"]').selectOption("e2e_branch_a1");
    await page.getByRole("button", { name: "Aplicar" }).click();

    await expect(page.getByText(/E2E Queijo por peso/)).toBeVisible();
    await expect(page.getByText("E2E Filial A2 (1)")).toHaveCount(0);
    await expect(page.getByText("E2E Produto exclusivo B")).toHaveCount(0);
  });
});
