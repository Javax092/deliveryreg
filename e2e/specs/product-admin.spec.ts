import { expect, test } from "@playwright/test";

import { checkoutPickup, e2e, login, prisma } from "../fixtures";

test.describe("Gestão comercial de produtos", () => {
  test("admin cadastra produto, publica no catalogo, vende e depois desativa", async ({ page }) => {
    const productName = `E2E Produto Admin ${Date.now()}`;

    await login(page, e2e.users.managerA);
    await page.goto("/produtos/novo");
    await expect(page.getByRole("heading", { name: "Cadastrar produto" })).toBeVisible();

    await page.getByLabel("Nome").fill(productName);
    await page.getByLabel("Descrição").fill("Produto criado pelo E2E de gestão comercial.");
    await page.getByLabel("Preço").fill("18,90");
    await page.getByLabel("E2E Filial A2").uncheck();
    await page.getByRole("button", { name: "Cadastrar produto" }).click();
    await expect(page.getByRole("status")).toContainText(`Produto ${productName} cadastrado.`);

    const product = await prisma.product.findFirstOrThrow({
      where: { name: productName },
      include: {
        prices: { where: { endsAt: null } },
        availability: true
      }
    });
    expect(product.isActive).toBe(true);
    expect(product.prices[0].priceCents).toBe(1890);
    expect(product.availability).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ branchId: "e2e_branch_a1", isAvailable: true })
      ])
    );

    await page.goto(`/catalogo?origem=${e2e.sourceA1}`);
    await expect(page.getByRole("link", { name: productName })).toBeVisible();
    await expect(page.getByText("R$ 18,90/un.")).toBeVisible();
    await page.getByRole("link", { name: productName }).click();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("link", { name: "Ver carrinho" }).click();
    const orderId = await checkoutPickup(page, "Cliente E2E Produto Admin", "92955550000");

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true }
    });
    expect(order.totalCents).toBe(1890);
    expect(order.items[0]).toMatchObject({
      productId: product.id,
      priceCentsSnapshot: 1890
    });

    await page.goto(`/produtos/${product.id}`);
    await page.getByLabel("Produto ativo no catálogo").uncheck();
    await page.getByRole("button", { name: "Salvar produto" }).click();
    await expect(page.getByRole("status")).toContainText(`Produto ${productName} atualizado.`);

    await page.goto(`/catalogo?origem=${e2e.sourceA1}`);
    await expect(page.getByRole("link", { name: productName })).not.toBeVisible();

    const responseStatus = await page.evaluate(
      async ({ productId }) => {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            branchId: "e2e_branch_a1",
            sourceCode: "qr-e2e-a1",
            idempotencyKey: crypto.randomUUID(),
            customer: {
              name: "Cliente E2E Produto Inativo",
              whatsapp: "92955550001"
            },
            items: [
              {
                productId,
                requestedQuantity: 1
              }
            ]
          })
        });
        return response.status;
      },
      { productId: product.id }
    );

    expect(responseStatus).toBe(404);
  });
});
