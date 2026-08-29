import { expect, test } from "@playwright/test";

import {
  addWeightProductToCart,
  checkoutPickup,
  createOpenCashSessionDirect,
  e2e,
  login,
  prisma,
} from "../fixtures";

test.describe("Operacao, pesagem, pagamento e estoque", () => {
  test("executa pedido por peso de 500 g com peso real de 518 g ate conclusao", async ({
    page,
  }) => {
    await addWeightProductToCart(page, 500);
    const orderId = await checkoutPickup(
      page,
      "Cliente E2E Peso",
      "92922220000",
    );
    await createOpenCashSessionDirect();

    await login(page, e2e.users.attendantA1);
    await expect(
      page.getByRole("heading", { name: "Central de pedidos" }),
    ).toBeVisible();
    await page.goto("/operacao");

    const orderCard = page
      .locator("article")
      .filter({ hasText: `Pedido #${orderId.slice(-6)}` });
    await expect(orderCard).toBeVisible();
    await orderCard.getByRole("button", { name: "Aceitar" }).click();
    await expect(
      orderCard.getByRole("button", { name: "Iniciar preparo" }),
    ).toBeVisible();
    await orderCard.getByRole("button", { name: "Iniciar preparo" }).click();
    await expect(orderCard.getByLabel("Peso real")).toBeVisible();
    await orderCard.getByLabel("Peso real").fill("518");
    await orderCard.getByRole("button", { name: "Confirmar" }).click();

    await expect(orderCard.getByText("Peso separado: 518 g")).toBeVisible();
    await expect(
      orderCard.getByText("Registrado para controle de estoque."),
    ).toBeVisible();
    await expect(orderCard.getByText("R$ 21,00").first()).toBeVisible();

    await orderCard.getByRole("button", { name: "Marcar como pronto" }).click();
    await expect(
      orderCard.getByRole("button", { name: "Finalizar pedido" }),
    ).toBeVisible();
    await orderCard.getByRole("button", { name: "Finalizar pedido" }).click();
    await expect(
      page.getByText(`Pedido #${orderId.slice(-6)}`),
    ).not.toBeVisible();

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
    expect(order.status).toBe("COMPLETED");
    expect(order.totalCents).toBe(2100);
    expect(order.items[0]).toMatchObject({
      requestedQuantity: 500,
      actualQuantity: 518,
      priceCentsSnapshot: 4200,
      estimatedAmountCents: 2100,
      finalAmountCents: 2100,
    });
    expect(order.payments).toHaveLength(1);
    expect(order.payments[0]).toMatchObject({
      method: "CASH",
      amountCents: 2100,
    });

    const saleMovements = await prisma.stockMovement.findMany({
      where: { sourceId: orderId, type: "SALE" },
    });
    expect(saleMovements).toHaveLength(1);
    expect(saleMovements[0].quantityDelta).toBe(-518);
  });

  test("refresh apos pedido concluido nao duplica pagamento nem baixa de estoque", async ({
    page,
  }) => {
    await addWeightProductToCart(page, 500);
    const orderId = await checkoutPickup(
      page,
      "Cliente E2E Duplicidade",
      "92922220001",
    );
    await createOpenCashSessionDirect();

    await login(page, e2e.users.attendantA1);
    await page.goto("/operacao");
    const orderCard = page
      .locator("article")
      .filter({ hasText: `Pedido #${orderId.slice(-6)}` });
    await orderCard.waitFor();
    await orderCard.getByRole("button", { name: "Aceitar" }).click();
    await orderCard.getByRole("button", { name: "Iniciar preparo" }).click();
    await orderCard.getByLabel("Peso real").fill("500");
    await orderCard.getByRole("button", { name: "Confirmar" }).click();
    await orderCard.getByRole("button", { name: "Marcar como pronto" }).click();
    await orderCard.getByRole("button", { name: "Finalizar pedido" }).click();
    await page.reload();

    expect(await prisma.payment.count({ where: { orderId } })).toBe(1);
    expect(
      await prisma.stockMovement.count({
        where: { sourceId: orderId, type: "SALE" },
      }),
    ).toBe(1);
  });

  test("bloqueia marcar pronto quando produto por peso ainda nao foi pesado", async ({
    page,
  }) => {
    await addWeightProductToCart(page, 500);
    const orderId = await checkoutPickup(
      page,
      "Cliente E2E Bloqueio Peso",
      "92922220002",
    );

    await login(page, e2e.users.attendantA1);
    await page.goto("/operacao");

    const orderCard = page
      .locator("article")
      .filter({ hasText: `Pedido #${orderId.slice(-6)}` });
    await expect(orderCard).toBeVisible();
    await orderCard.getByRole("button", { name: "Aceitar" }).click();
    await orderCard.getByRole("button", { name: "Iniciar preparo" }).click();

    await expect(
      orderCard.getByRole("button", { name: "Marcar como pronto" }),
    ).not.toBeVisible();
    await expect(
      orderCard.getByText(
        "Confirme o peso separado dos itens antes de marcar o pedido como pronto.",
      ),
    ).toBeVisible();

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
    });
    expect(order.status).toBe("PREPARING");
  });
});
