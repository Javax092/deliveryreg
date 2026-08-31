import { expect, test } from "@playwright/test";

import {
  addUnitProductToCart,
  addWeightProductToCart,
  checkoutPickup,
  createOpenCashSessionDirect,
  e2e,
  login,
  logout,
  prisma
} from "../fixtures";

test.describe("Catalogo publico e pedido", () => {
  test("redireciona a raiz para o catalogo publico", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/catalogo$/);
    await expect(page.getByRole("heading", { name: "E2E Business A" })).toBeVisible();
  });

  test("resolve origem publica Alvorada 1 e Alvorada 2", async ({ page }) => {
    await page.goto(`/catalogo?origem=${e2e.alvoradaSourceA1}`);
    await expect(page.getByText("Unidade E2E Filial A1")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver carrinho" })).toHaveAttribute(
      "href",
      `/carrinho?origem=${e2e.alvoradaSourceA1}`
    );

    await page.goto(`/catalogo?origem=${e2e.alvoradaSourceA2}`);
    await expect(page.getByText("Unidade E2E Filial A2")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver carrinho" })).toHaveAttribute(
      "href",
      `/carrinho?origem=${e2e.alvoradaSourceA2}`
    );
  });

  test("carrega catalogo por QR, monta carrinho e cria pedido de retirada", async ({ page }) => {
    await page.goto(`/catalogo?source=${e2e.sourceA1}`);

    await expect(page.getByText("E2E Filial A1")).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(e2e.weightProductName) })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(e2e.unitProductName) })).toBeVisible();
    await expect(page.getByText("R$ 42,00/kg")).toBeVisible();

    await addUnitProductToCart(page);
    await page.getByRole("link", { name: "Ver carrinho" }).click();

    await expect(page.getByText(e2e.unitProductName)).toBeVisible();
    await expect(page.getByText("Total estimado")).toBeVisible();
    await expect(page.getByText("R$ 12,00", { exact: true })).toBeVisible();

    const orderId = await checkoutPickup(page, "Cliente E2E Retirada", "92911110000");
    await expect(page.getByText("Status: Novo")).toBeVisible();
    await expect(page.getByText(e2e.unitProductName)).toBeVisible();

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true }
    });
    expect(order.status).toBe("CREATED");
    expect(order.fulfillmentType).toBe("PICKUP");
    expect(order.totalCents).toBe(1200);
    expect(order.items).toHaveLength(1);
  });

  test("jornada QR, cardapio, checkout e atendimento operacional", async ({ page }) => {
    await login(page, e2e.users.managerA);
    await page.goto("/produtos");
    await expect(page.getByText(e2e.unitProductName)).toBeVisible();
    await logout(page);

    await page.goto(`/catalogo?source=${e2e.sourceA1}`);
    await expect(page.getByRole("heading", { name: "E2E Business A" })).toBeVisible();
    await expect(page.getByText("Unidade E2E Filial A1")).toBeVisible();
    await page.getByRole("link", { name: new RegExp(e2e.unitProductName) }).first().click();
    await expect(page.getByRole("heading", { name: e2e.unitProductName })).toBeVisible();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("link", { name: "Ver carrinho" }).click();

    const orderId = await checkoutPickup(page, "Cliente E2E Jornada", "92944440000");
    await createOpenCashSessionDirect();

    await login(page, e2e.users.attendantA1);
    await page.goto("/operacao");
    await expect(page.getByRole("heading", { name: "Central de pedidos" })).toBeVisible();
    const orderCard = page.locator("article").filter({ hasText: `Pedido #${orderId.slice(-6)}` });
    await expect(orderCard).toBeVisible();
    await expect(orderCard.getByText("Cliente E2E Jornada").first()).toBeVisible();
    await orderCard.getByRole("button", { name: "Aceitar" }).click();
    await expect(orderCard.getByRole("button", { name: "Iniciar preparo" })).toBeVisible();
    await orderCard.getByRole("button", { name: "Iniciar preparo" }).click();
    await expect(orderCard.getByRole("button", { name: "Marcar como pronto" })).toBeVisible();
    await orderCard.getByRole("button", { name: "Marcar como pronto" }).click();
    await expect(orderCard.getByRole("button", { name: "Finalizar" })).toBeVisible();
    await orderCard.getByRole("button", { name: "Finalizar" }).click();
    await expect(page.getByText(`Pedido #${orderId.slice(-6)}`)).not.toBeVisible();

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { payments: true }
    });
    expect(order.status).toBe("COMPLETED");
    expect(order.leadSourceId).toBe("e2e_source_a1");
    expect(order.branchId).toBe("e2e_branch_a1");
    expect(order.payments).toHaveLength(1);
  });

  for (const width of [360, 390, 430]) {
    test(`fluxo publico mobile em ${width}px nao tem overflow horizontal`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      await addWeightProductToCart(page, 500);
      await page.getByRole("link", { name: "Ver carrinho" }).click();
      await expect(page.getByText("Total estimado")).toBeVisible();
      await expect(page.getByRole("button", { name: /Fazer pedido/ })).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});
