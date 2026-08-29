import { expect, test } from "@playwright/test";

import { e2e, login, prisma } from "../fixtures";

test("atendente autenticado aceita pedido via Server Action real", async ({
  page,
}) => {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: "e2e_product_weight" },
  });
  const order = await prisma.order.create({
    data: {
      businessId: "e2e_business_a",
      branchId: "e2e_branch_a1",
      status: "CREATED",
      subtotalCents: 2100,
      totalCents: 2100,
      items: {
        create: {
          businessId: "e2e_business_a",
          productId: product.id,
          productNameSnapshot: "E2E Aceite Server Action",
          measurementTypeSnapshot: "WEIGHT",
          requestedQuantity: 500,
          priceCentsSnapshot: 4200,
          priceBasisQuantitySnapshot: 1000,
          priceBasisUnitSnapshot: "GRAM",
          estimatedAmountCents: 2100,
        },
      },
    },
  });

  await login(page, e2e.users.attendantA1);
  const authenticatedUser = page.locator(".admin-user");
  await expect(authenticatedUser.getByText("Atendente")).toBeVisible();
  await expect(authenticatedUser.getByText("ATTENDANT")).toBeVisible();

  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === "deliveryreg_session")).toBe(
    true,
  );

  await page.goto("/operacao");
  await expect(
    page.getByRole("heading", { name: "Central de pedidos" }),
  ).toBeVisible();

  const orderCard = page
    .locator("article")
    .filter({ hasText: `Pedido #${order.id.slice(-6)}` });
  await expect(orderCard).toBeVisible();

  const acceptRequestPromise = page.waitForRequest(
    (request) =>
      request.method() === "POST" && request.url().endsWith("/operacao"),
  );
  await orderCard.getByRole("button", { name: "Aceitar pedido" }).click();
  const acceptRequest = await acceptRequestPromise;
  const acceptRequestHeaders = await acceptRequest.allHeaders();

  await expect(
    orderCard.getByRole("button", { name: "Iniciar preparo" }),
  ).toBeVisible();
  expect(acceptRequestHeaders.cookie).toContain("deliveryreg_session=");

  await expect
    .poll(async () => {
      const updated = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
      });
      return updated.status;
    })
    .toBe("ACCEPTED");
});
