import { expect, test } from "@playwright/test";

import {
  addWeightProductToCart,
  checkoutDelivery,
  createOpenCashSessionDirect,
  e2e,
  login,
  logout,
  prisma
} from "../fixtures";

test.describe("PDV, estoque e delivery", () => {
  test("finaliza venda no PDV com pagamento PIX e baixa estoque uma vez", async ({ page }) => {
    await createOpenCashSessionDirect();
    await login(page, e2e.users.attendantA1);
    await page.goto("/pdv");

    await page.getByLabel("Unidade", { exact: true }).selectOption("e2e_branch_a1");
    await page.getByLabel("Produto").selectOption("e2e_product_unit");
    await page.getByLabel("Quantidade ou peso em unidade base").fill("2");
    await page.getByLabel("Forma de pagamento").selectOption("PIX");
    await page.getByRole("button", { name: "Finalizar venda" }).click();

    await expect
      .poll(() =>
        prisma.order.count({
          where: {
            salesChannel: "POS",
            items: {
              some: {
                productId: "e2e_product_unit",
                requestedQuantity: 2
              }
            }
          }
        })
      )
      .toBeGreaterThan(0);

    const order = await prisma.order.findFirstOrThrow({
      where: {
        salesChannel: "POS",
        items: {
          some: {
            productId: "e2e_product_unit",
            requestedQuantity: 2
          }
        }
      },
      orderBy: { createdAt: "desc" },
      include: { payments: true }
    });
    expect(order.status).toBe("COMPLETED");
    expect(order.totalCents).toBe(2400);
    expect(order.payments[0]).toMatchObject({ method: "PIX", amountCents: 2400 });

    const movements = await prisma.stockMovement.findMany({
      where: { sourceId: order.id, type: "SALE" }
    });
    expect(movements).toHaveLength(1);
    expect(movements[0].quantityDelta).toBe(-2);
  });

  test("bloqueia estoque insuficiente na jornada comercial do PDV", async ({ page }) => {
    await createOpenCashSessionDirect();
    await login(page, e2e.users.attendantA1);
    await page.goto("/pdv");
    await page.getByLabel("Unidade", { exact: true }).selectOption("e2e_branch_a1");
    await page.getByLabel("Produto").selectOption("e2e_product_unit");
    await page.getByLabel("Quantidade ou peso em unidade base").fill("9999");
    await page.getByRole("button", { name: "Finalizar venda" }).click();

    expect(
      await prisma.order.count({
        where: {
          salesChannel: "POS",
          items: { some: { productId: "e2e_product_unit", requestedQuantity: 9999 } }
        }
      })
    ).toBe(0);
  });

  test("atribui, reatribui e restringe visibilidade de entregas por courier", async ({ page }) => {
    await addWeightProductToCart(page, 500);
    const orderId = await checkoutDelivery(page, "Cliente E2E Delivery", "92933330000");
    const delivery = await prisma.delivery.findFirstOrThrow({ where: { orderId } });

    await login(page, e2e.users.managerA);
    await page.goto("/entregas");
    await expect(page.getByText(`Entrega #${delivery.id.slice(-6)}`)).toBeVisible();
    const deliveryForm = page.locator(`form:has(input[value="${delivery.id}"])`);
    await deliveryForm.getByRole("combobox").selectOption({
      label: "E2E Delivery A1"
    });
    await deliveryForm.getByRole("button", { name: "Atribuir entrega" }).click();

    await logout(page);
    await login(page, e2e.users.deliveryA1);
    await page.goto("/entregas");
    await expect(page.getByText(`Entrega #${delivery.id.slice(-6)}`)).toBeVisible();

    await logout(page);
    await login(page, e2e.users.deliveryA2);
    await page.goto("/entregas");
    await expect(page.getByText(`Entrega #${delivery.id.slice(-6)}`)).not.toBeVisible();
    await expect(page.getByText("Nenhuma entrega em andamento.")).toBeVisible();

    await logout(page);
    await login(page, e2e.users.managerA);
    await page.goto("/entregas");
    const reassignForm = page.locator(`form:has(input[value="${delivery.id}"])`);
    await reassignForm.getByRole("combobox").selectOption({
      label: "E2E Delivery A1 Secundario"
    });
    await reassignForm.getByRole("button", { name: "Atribuir entrega" }).click();

    await logout(page);
    await login(page, e2e.users.deliveryA1);
    await page.goto("/entregas");
    await expect(page.getByText(`Entrega #${delivery.id.slice(-6)}`)).not.toBeVisible();

    await logout(page);
    await login(page, e2e.users.deliveryA1b);
    await page.goto("/entregas");
    await expect(page.getByText(`Entrega #${delivery.id.slice(-6)}`)).toBeVisible();

    expect(await prisma.auditLog.count({ where: { action: "DELIVERY_ASSIGNED", entityId: delivery.id } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { action: "DELIVERY_REASSIGNED", entityId: delivery.id } })).toBe(1);
  });
});
