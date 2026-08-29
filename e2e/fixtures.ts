import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const e2e = {
  password: "senha-e2e-local-2026",
  sourceA1: "qr-e2e-a1",
  sourceA2: "qr-e2e-a2",
  weightProductName: "E2E Queijo por peso",
  unitProductName: "E2E Produto unitario",
  businessBProductName: "E2E Produto exclusivo B",
  users: {
    ownerA: "owner.a@e2e.local",
    managerA: "manager.a@e2e.local",
    attendantA1: "attendant.a1@e2e.local",
    deliveryA1: "delivery.a1@e2e.local",
    deliveryA1b: "delivery.a1b@e2e.local",
    deliveryA2: "delivery.a2@e2e.local",
    inactiveA: "inactive.a@e2e.local",
    ownerB: "owner.b@e2e.local"
  }
};

export async function login(page: Page, email: string, password = e2e.password) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(painel|operacao|entregas)$/);
}

export async function expectProtectedPage(page: Page, title: string) {
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

export async function logout(page: Page) {
  await page.goto("/sair");
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
}

export async function addWeightProductToCart(page: Page, grams = 500) {
  await page.goto(`/catalogo?origem=${e2e.sourceA1}`);
  await page.getByRole("link", { name: new RegExp(e2e.weightProductName) }).click();
  await page.getByLabel("Quantidade personalizada").fill(String(grams));
  await expect(page.getByText("R$ 21,00")).toBeVisible();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page.getByRole("status")).toContainText("Produto adicionado");
}

export async function addUnitProductToCart(page: Page) {
  await page.goto(`/catalogo?origem=${e2e.sourceA1}`);
  await page.getByRole("link", { name: new RegExp(e2e.unitProductName) }).click();
  await expect(page.getByText("R$ 12,00")).toBeVisible();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page.getByRole("status")).toContainText("Produto adicionado");
}

export async function checkoutPickup(page: Page, customerName: string, phone: string) {
  if (!(await page.getByRole("heading", { name: "Carrinho", exact: true }).isVisible().catch(() => false))) {
    await page.getByRole("link", { name: "Ver carrinho" }).click();
  }
  await expect(page.getByRole("heading", { name: "Carrinho", exact: true })).toBeVisible();
  await page.getByLabel("Nome").fill(customerName);
  await page.getByLabel("WhatsApp").fill(phone);
  await page.getByRole("button", { name: /Confirmar pedido/ }).click();
  await expect(page.getByText("Pedido confirmado")).toBeVisible();
  return page.url().split("/pedido/")[1]?.split(/[?#]/)[0] ?? "";
}

export async function checkoutDelivery(page: Page, customerName: string, phone: string) {
  if (!(await page.getByRole("heading", { name: "Carrinho", exact: true }).isVisible().catch(() => false))) {
    await page.getByRole("link", { name: "Ver carrinho" }).click();
  }
  await page.getByLabel("Como você quer receber").selectOption("DELIVERY");
  await page.getByPlaceholder("Rua").fill("Rua E2E");
  await page.getByPlaceholder("Número").fill("100");
  await page.getByPlaceholder("Bairro").fill("Centro");
  await page.getByPlaceholder("Referência").fill("Portaria");
  await page.getByLabel("Nome").fill(customerName);
  await page.getByLabel("WhatsApp").fill(phone);
  await page.getByRole("button", { name: /Confirmar pedido/ }).click();
  await expect(page.getByText("Pedido confirmado")).toBeVisible();
  return page.url().split("/pedido/")[1]?.split(/[?#]/)[0] ?? "";
}

export async function createA2OrderDirect() {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: "e2e_business_a" } });
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: "e2e_branch_a2" } });
  const product = await prisma.product.findUniqueOrThrow({ where: { id: "e2e_product_weight" } });
  return prisma.order.create({
    data: {
      businessId: business.id,
      branchId: branch.id,
      status: "CREATED",
      subtotalCents: 2100,
      totalCents: 2100,
      items: {
        create: {
          businessId: business.id,
          productId: product.id,
          productNameSnapshot: "E2E Pedido A2 Invisivel",
          measurementTypeSnapshot: "WEIGHT",
          requestedQuantity: 500,
          priceCentsSnapshot: 4200,
          priceBasisQuantitySnapshot: 1000,
          priceBasisUnitSnapshot: "GRAM",
          estimatedAmountCents: 2100
        }
      }
    }
  });
}

export async function createOpenCashSessionDirect(branchId = "e2e_branch_a1", openingAmountCents = 0) {
  const user = await prisma.user.findFirstOrThrow({ where: { email: e2e.users.ownerA } });
  const existing = await prisma.cashSession.findFirst({
    where: {
      businessId: user.businessId,
      branchId,
      status: "OPEN"
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.cashSession.create({
    data: {
      businessId: user.businessId,
      branchId,
      openedByUserId: user.id,
      openingAmountCents
    }
  });
}
