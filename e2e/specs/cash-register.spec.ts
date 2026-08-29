import { expect, test, type Page } from "@playwright/test";

import { e2e, login } from "../fixtures";

test.describe("Caixa operacional", () => {
  test("OWNER abre, movimenta, fecha e consulta historico read-only", async ({ page }) => {
    await login(page, e2e.users.ownerA);
    await page.goto("/caixa?branchId=e2e_branch_a1");

    await expect(page.getByRole("heading", { name: "Caixa", exact: true })).toBeVisible();
    await page.getByLabel("Fundo inicial").fill("200,00");
    await page.getByRole("button", { name: "Abrir caixa" }).click();
    await expect(page.getByRole("heading", { name: "Caixa aberto" })).toBeVisible();

    await createPdvSale(page, "e2e_branch_a1", "Dinheiro");

    await page.goto("/caixa?branchId=e2e_branch_a1");
    await expect(page.getByText("R$ 212,00").first()).toBeVisible();

    await page.getByLabel("Valor").first().fill("100,00");
    await page.getByLabel("Motivo").first().fill("Troco adicional");
    await page.getByRole("button", { name: "Registrar suprimento" }).click();
    await expect(page.getByText("Suprimento registrado.")).toBeVisible();

    await page.getByLabel("Valor").nth(1).fill("50,00");
    await page.getByLabel("Motivo").nth(1).fill("Retirada de excesso");
    await page.getByRole("button", { name: "Registrar sangria" }).click();
    await expect(page.getByText("Sangria registrada.")).toBeVisible();

    await page.getByLabel("Dinheiro contado").fill("260,00");
    await page.getByLabel("Observação se houver diferença").fill("Faltou troco na contagem");
    await page.getByRole("button", { name: "Confirmar fechamento" }).click();
    await expect(page.getByRole("heading", { name: "Caixa fechado" })).toBeVisible();

    await page.goto("/caixa/historico?period=today&branchId=e2e_branch_a1");
    await expect(page.getByRole("heading", { name: "Histórico de caixa" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Fechado" })).toBeVisible();
    await expect(page.getByText("-R$ 2,00").first()).toBeVisible();
    await page.locator("tbody a").first().click();

    await expect(page.getByRole("heading", { name: /Caixa #/ })).toBeVisible();
    await expect(page.getByText("Esperado")).toBeVisible();
    await expect(page.getByText("R$ 262,00").first()).toBeVisible();
    await expect(page.getByText("R$ 260,00").first()).toBeVisible();
    await expect(page.getByText("-R$ 2,00").first()).toBeVisible();
    await expect(page.getByText("Faltou troco na contagem")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmar fechamento" })).toHaveCount(0);
  });

  test("CASH aumenta dinheiro esperado e PIX fica em outros recebimentos", async ({ page }) => {
    await login(page, e2e.users.ownerA);
    await page.goto("/caixa?branchId=e2e_branch_a2");

    await page.getByLabel("Fundo inicial").fill("100,00");
    await page.getByRole("button", { name: "Abrir caixa" }).click();
    await expect(page.getByRole("heading", { name: "Caixa aberto" })).toBeVisible();
    await expect(page.getByText("R$ 100,00").first()).toBeVisible();

    await createPdvSale(page, "e2e_branch_a2", "Dinheiro", /E2E Queijo por peso/, "1000");

    await page.goto("/caixa?branchId=e2e_branch_a2");
    await expect(page.getByText("R$ 142,00").first()).toBeVisible();
    await expect(page.getByText("Vendas em dinheiro")).toBeVisible();

    await createPdvSale(page, "e2e_branch_a2", "Pix", /E2E Queijo por peso/, "1000");

    await page.goto("/caixa?branchId=e2e_branch_a2");
    await expect(page.getByText("R$ 142,00").first()).toBeVisible();
    await expect(page.locator("section").filter({ hasText: "Outros recebimentos" }).getByText("PIX")).toBeVisible();
    await expect(page.locator("section").filter({ hasText: "Outros recebimentos" }).getByText("R$ 42,00")).toBeVisible();

    await page.getByLabel("Dinheiro contado").fill("142,00");
    await page.getByRole("button", { name: "Confirmar fechamento" }).click();
    await expect(page.getByRole("heading", { name: "Caixa fechado" })).toBeVisible();
  });
});

async function createPdvSale(
  page: Page,
  branchId: string,
  paymentLabel: "Dinheiro" | "Pix",
  productName: RegExp = /E2E Produto unitario/,
  quantity = "1"
) {
  await page.goto("/pdv");
  await page.getByRole("combobox", { name: "Unidade" }).selectOption(branchId);
  await page.getByRole("button", { name: productName }).click();
  await page.getByRole("spinbutton").fill(quantity);
  await page.getByText(paymentLabel, { exact: true }).click();
  await page.getByRole("button", { name: "Finalizar venda" }).click();
  await expect(page.getByText("Venda finalizada.")).toBeVisible();
}
