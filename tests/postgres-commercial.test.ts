import { describe, expect, it, beforeEach, afterAll } from "vitest";
import { PrismaClient, type InternalRole } from "@prisma/client";

import { createPickupOrder } from "@/modules/orders/create-pickup-order";
import { completeOrder } from "@/modules/orders/complete-order";
import {
  confirmActualWeight,
  transitionOperationalOrder,
} from "@/modules/orders/operation";
import {
  createCommercialProduct,
  updateCommercialProduct,
} from "@/modules/catalog/admin-service";
import { createPosSale } from "@/modules/pos/create-pos-sale";
import { adjustInventory, transferInventory } from "@/modules/inventory/operations";
import { assignDelivery } from "@/modules/delivery/operation";
import { hashPassword } from "@/modules/identity/password";
import {
  getManagementDashboard,
  resolveManagementPeriod,
} from "@/modules/management/dashboard";
import { getPublicCatalog } from "@/modules/public-catalog/queries";
import {
  closeCashSession,
  createCashMovement,
  openCashSession,
} from "@/modules/cash/service";
import type { AuthContext } from "@/modules/shared/auth/context";

const run = process.env.RUN_POSTGRES_TESTS === "1" ? describe : describe.skip;
const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.analyticsEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.cashSession.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.productBranchAvailability.deleteMany();
  await prisma.productPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.leadSource.deleteMany();
  await prisma.userBranchAccess.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.business.deleteMany();
}

async function createFixture() {
  const business = await prisma.business.create({
    data: {
      name: "Empresa Teste",
      timezone: "America/Manaus",
    },
  });
  const [branchA, branchB] = await Promise.all([
    prisma.branch.create({
      data: { businessId: business.id, name: "Filial 1" },
    }),
    prisma.branch.create({
      data: { businessId: business.id, name: "Filial 2" },
    }),
  ]);
  const category = await prisma.productCategory.create({
    data: { businessId: business.id, name: "Queijos", slug: "queijos" },
  });
  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: category.id,
      name: "Queijo regional",
      slug: "queijo-regional",
      measurementType: "WEIGHT",
      baseUnit: "GRAM",
      sellingIncrement: 1,
      minimumOrderQuantity: 1,
    },
  });
  await prisma.productPrice.create({
    data: {
      businessId: business.id,
      productId: product.id,
      priceCents: 4200,
      basisQuantity: 1000,
      basisUnit: "GRAM",
    },
  });
  await Promise.all(
    [branchA, branchB].map((branch) =>
      prisma.productBranchAvailability.create({
        data: {
          businessId: business.id,
          branchId: branch.id,
          productId: product.id,
        },
      }),
    ),
  );
  const owner = await createUser(
    business.id,
    branchA.id,
    "owner@teste.local",
    "OWNER",
  );
  const attendant = await createUser(
    business.id,
    branchA.id,
    "atendente@teste.local",
    "ATTENDANT",
  );
  const courier = await createUser(
    business.id,
    branchA.id,
    "entrega@teste.local",
    "DELIVERY",
  );
  const source = await prisma.leadSource.create({
    data: {
      businessId: business.id,
      branchId: branchA.id,
      code: "qr-filial-1",
      label: "QR Filial 1",
    },
  });
  await prisma.deliveryZone.create({
    data: {
      businessId: business.id,
      branchId: branchA.id,
      name: "Centro",
      normalizedName: "centro",
      feeCents: 800,
      minimumOrderCents: 100,
    },
  });
  await prisma.stockMovement.create({
    data: {
      businessId: business.id,
      branchId: branchA.id,
      productId: product.id,
      type: "PURCHASE",
      quantityDelta: 1000,
      reason: "Carga inicial",
    },
  });

  return {
    business,
    branchA,
    branchB,
    product,
    owner,
    attendant,
    courier,
    source,
  };
}

async function createUser(
  businessId: string,
  branchId: string,
  email: string,
  role: InternalRole,
) {
  const user = await prisma.user.create({
    data: {
      businessId,
      email,
      name: email.split("@")[0],
      role,
      passwordHash: await hashPassword("senha-de-teste"),
    },
  });
  await prisma.userBranchAccess.create({ data: { userId: user.id, branchId } });
  return user;
}

function context(
  user: { id: string; businessId: string; role: InternalRole },
  branchIds: string[],
): AuthContext {
  return {
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
    branchIds,
  };
}

async function createPreparingOrder(
  fixture: Awaited<ReturnType<typeof createFixture>>,
) {
  const created = await createPickupOrder({
    businessId: fixture.business.id,
    branchId: fixture.branchA.id,
    leadSourceId: fixture.source.id,
    anonymousId: "anon-1",
    idempotencyKey: `pedido-${crypto.randomUUID()}`,
    customer: { name: "Cliente Teste", whatsapp: "92999999999" },
    items: [{ productId: fixture.product.id, requestedQuantity: 500 }],
  });
  const createdOrderId =
    typeof created === "object" && created && "orderId" in created
      ? String(created.orderId)
      : "";
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: createdOrderId },
    include: { items: true },
  });
  const ctx = context(fixture.attendant, [fixture.branchA.id]);
  await transitionOperationalOrder({
    context: ctx,
    orderId: order.id,
    toStatus: "ACCEPTED",
  });
  await transitionOperationalOrder({
    context: ctx,
    orderId: order.id,
    toStatus: "PREPARING",
  });
  return prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { items: true },
  });
}

async function createReadyOrder(
  fixture: Awaited<ReturnType<typeof createFixture>>,
) {
  const order = await createPreparingOrder(fixture);
  const ctx = context(fixture.attendant, [fixture.branchA.id]);
  await confirmActualWeight({
    context: ctx,
    orderItemId: order.items[0].id,
    actualQuantity: order.items[0].requestedQuantity,
    idempotencyKey: `peso-${crypto.randomUUID()}`,
  });
  await transitionOperationalOrder({
    context: ctx,
    orderId: order.id,
    toStatus: "READY",
  });
  return prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { items: true },
  });
}

beforeEach(resetDatabase);
afterAll(async () => prisma.$disconnect());

run("PostgreSQL comercial e concorrência", () => {
  it("finaliza venda ponderada com pagamento, baixa de estoque e snapshot de preço", async () => {
    const fixture = await createFixture();
    const order = await createPreparingOrder(fixture);
    const ctx = context(fixture.attendant, [fixture.branchA.id]);
    await openFixtureCashSession(fixture, ctx);

    const weight = await confirmActualWeight({
      context: ctx,
      orderItemId: order.items[0].id,
      actualQuantity: 518,
      idempotencyKey: "peso-1",
    });
    expect(weight).toMatchObject({
      requestedQuantity: 500,
      actualQuantity: 518,
      estimatedAmountCents: 2100,
      finalAmountCents: 2100,
    });

    await transitionOperationalOrder({
      context: ctx,
      orderId: order.id,
      toStatus: "READY",
    });
    await completeOrder({
      context: ctx,
      orderId: order.id,
      idempotencyKey: "fim-1",
      paymentMethod: "PIX",
    });

    const persisted = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true, payments: true },
    });
    expect(persisted.status).toBe("COMPLETED");
    expect(persisted.totalCents).toBe(2100);
    expect(persisted.items[0]).toMatchObject({
      requestedQuantity: 500,
      actualQuantity: 518,
      estimatedAmountCents: 2100,
      finalAmountCents: 2100,
      priceCentsSnapshot: 4200,
    });
    expect(persisted.payments).toHaveLength(1);
    expect(persisted.payments[0].amountCents).toBe(2100);
    const saleMovements = await prisma.stockMovement.findMany({
      where: { sourceId: order.id, type: "SALE" },
    });
    expect(saleMovements).toHaveLength(1);
    expect(saleMovements[0].quantityDelta).toBe(-518);
  });

  it("preserva histórico quando o preço atual muda", async () => {
    const fixture = await createFixture();
    const order = await createPreparingOrder(fixture);
    await prisma.productPrice.updateMany({
      where: {
        businessId: fixture.business.id,
        productId: fixture.product.id,
        endsAt: null,
      },
      data: { endsAt: new Date() },
    });
    await prisma.productPrice.create({
      data: {
        businessId: fixture.business.id,
        productId: fixture.product.id,
        priceCents: 5000,
        basisQuantity: 1000,
        basisUnit: "GRAM",
      },
    });

    const item = await prisma.orderItem.findFirstOrThrow({
      where: { orderId: order.id },
    });
    expect(item.priceCentsSnapshot).toBe(4200);
    expect(item.estimatedAmountCents).toBe(2100);
  });

  it("transfere estoque atomically sem criar quantidade", async () => {
    const fixture = await createFixture();
    const ctx = context(fixture.owner, [
      fixture.branchA.id,
      fixture.branchB.id,
    ]);
    await transferInventory({
      context: ctx,
      fromBranchId: fixture.branchA.id,
      toBranchId: fixture.branchB.id,
      productId: fixture.product.id,
      quantity: 300,
      reason: "Reposição",
    });

    const byBranch = await Promise.all(
      [fixture.branchA.id, fixture.branchB.id].map((branchId) =>
        prisma.stockMovement.aggregate({
          where: {
            businessId: fixture.business.id,
            branchId,
            productId: fixture.product.id,
          },
          _sum: { quantityDelta: true },
        }),
      ),
    );
    expect(byBranch[0]._sum.quantityDelta).toBe(700);
    expect(byBranch[1]._sum.quantityDelta).toBe(300);
    expect(
      (byBranch[0]._sum.quantityDelta ?? 0) +
        (byBranch[1]._sum.quantityDelta ?? 0),
    ).toBe(1000);
  });

  it("não duplica efeitos em dupla conclusão do mesmo pedido", async () => {
    const fixture = await createFixture();
    const order = await createReadyOrder(fixture);
    const ctx = context(fixture.attendant, [fixture.branchA.id]);
    await openFixtureCashSession(fixture, ctx);

    const results = await Promise.allSettled([
      completeOrder({
        context: ctx,
        orderId: order.id,
        idempotencyKey: "fim-a",
      }),
      completeOrder({
        context: ctx,
        orderId: order.id,
        idempotencyKey: "fim-b",
      }),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const saleMovements = await prisma.stockMovement.findMany({
      where: { sourceId: order.id, type: "SALE" },
    });
    expect(saleMovements).toHaveLength(1);
  });

  it("não duplica venda no retry idempotente do PDV", async () => {
    const fixture = await createFixture();
    const ctx = context(fixture.attendant, [fixture.branchA.id]);
    await openFixtureCashSession(fixture, ctx);
    const [first, second] = await Promise.all([
      createPosSale({
        context: ctx,
        branchId: fixture.branchA.id,
        productId: fixture.product.id,
        quantity: 100,
        paymentMethod: "PIX",
        idempotencyKey: "pdv-retry",
      }),
      createPosSale({
        context: ctx,
        branchId: fixture.branchA.id,
        productId: fixture.product.id,
        quantity: 100,
        paymentMethod: "PIX",
        idempotencyKey: "pdv-retry",
      }),
    ]);
    expect(first).toEqual(second);
    expect(await prisma.order.count({ where: { salesChannel: "POS" } })).toBe(
      1,
    );
    expect(await prisma.stockMovement.count({ where: { type: "SALE" } })).toBe(
      1,
    );
  });

  it("impede consumo concorrente acima do estoque disponível", async () => {
    const fixture = await createFixture();
    const ctx = context(fixture.attendant, [fixture.branchA.id]);
    await openFixtureCashSession(fixture, ctx);
    await prisma.stockMovement.deleteMany({
      where: { productId: fixture.product.id },
    });
    await prisma.stockMovement.create({
      data: {
        businessId: fixture.business.id,
        branchId: fixture.branchA.id,
        productId: fixture.product.id,
        type: "PURCHASE",
        quantityDelta: 600,
        reason: "Estoque limitado",
      },
    });
    const sale = (key: string) =>
      createPosSale({
        context: ctx,
        branchId: fixture.branchA.id,
        productId: fixture.product.id,
        quantity: 400,
        paymentMethod: "PIX",
        idempotencyKey: key,
      });

    const results = await Promise.allSettled([sale("sale-a"), sale("sale-b")]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const total = await prisma.stockMovement.aggregate({
      where: { productId: fixture.product.id },
      _sum: { quantityDelta: true },
    });
    expect(total._sum.quantityDelta).toBeGreaterThanOrEqual(0);
  });

  it("resolve corrida de confirmação de peso com apenas uma confirmação", async () => {
    const fixture = await createFixture();
    const order = await createPreparingOrder(fixture);
    const ctx = context(fixture.attendant, [fixture.branchA.id]);

    const results = await Promise.allSettled([
      confirmActualWeight({
        context: ctx,
        orderItemId: order.items[0].id,
        actualQuantity: 518,
        idempotencyKey: "peso-a",
      }),
      confirmActualWeight({
        context: ctx,
        orderItemId: order.items[0].id,
        actualQuantity: 520,
        idempotencyKey: "peso-b",
      }),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const item = await prisma.orderItem.findUniqueOrThrow({
      where: { id: order.items[0].id },
    });
    expect([518, 520]).toContain(item.actualQuantity);
  });

  it("isola empresas em leitura e mutação direta de operações", async () => {
    const fixtureA = await createFixture();
    const fixtureB = await createFixture();
    const ctxA = context(fixtureA.attendant, [fixtureA.branchA.id]);
    const ownerCtxA = context(fixtureA.owner, [fixtureA.branchA.id]);
    const orderB = await createReadyOrder(fixtureB);

    await expect(
      completeOrder({
        context: ctxA,
        orderId: orderB.id,
        idempotencyKey: "cross",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      adjustInventory({
        context: ownerCtxA,
        branchId: fixtureA.branchA.id,
        productId: fixtureB.product.id,
        quantityDelta: 1,
        reason: "Tentativa cross tenant",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("atribui entrega apenas para entregador autorizado da filial e audita", async () => {
    const fixture = await createFixture();
    const created = await createPickupOrder({
      businessId: fixture.business.id,
      branchId: fixture.branchA.id,
      leadSourceId: fixture.source.id,
      anonymousId: "anon-delivery",
      idempotencyKey: "delivery-1",
      fulfillmentType: "DELIVERY",
      address: { street: "Rua A", number: "10", neighborhood: "Centro" },
      customer: { name: "Cliente Entrega", whatsapp: "92988888888" },
      items: [{ productId: fixture.product.id, requestedQuantity: 500 }],
    });
    const createdOrderId =
      typeof created === "object" && created && "orderId" in created
        ? String(created.orderId)
        : "";
    const delivery = await prisma.delivery.findFirstOrThrow({
      where: { orderId: createdOrderId },
    });
    const ctx = context(fixture.owner, [fixture.branchA.id]);

    await assignDelivery({
      context: ctx,
      deliveryId: delivery.id,
      deliveryUserId: fixture.courier.id,
    });

    const assigned = await prisma.delivery.findUniqueOrThrow({
      where: { id: delivery.id },
    });
    expect(assigned.assignedUserId).toBe(fixture.courier.id);
    expect(
      await prisma.auditLog.count({ where: { action: "DELIVERY_ASSIGNED" } }),
    ).toBe(1);
  });

  it("cria e edita produto comercial com preço histórico e disponibilidade por filial", async () => {
    const fixture = await createFixture();
    const ctx = context(fixture.owner, [
      fixture.branchA.id,
      fixture.branchB.id,
    ]);

    const product = await createCommercialProduct({
      context: ctx,
      data: {
        name: "Produto Comercial Teste",
        description: "Criado pela gestão comercial.",
        categoryId: fixture.product.categoryId ?? "",
        imageUrl: "",
        measurementType: "UNIT",
        price: "12,50",
        minimumOrderQuantity: 1,
        sellingIncrement: 1,
        isActive: true,
        availableBranchIds: [fixture.branchA.id],
      },
    });

    expect(product.slug).toBe("produto-comercial-teste");
    expect(
      await prisma.productPrice.count({
        where: { productId: product.id, endsAt: null },
      }),
    ).toBe(1);
    expect(
      await prisma.productBranchAvailability.findUniqueOrThrow({
        where: {
          businessId_branchId_productId: {
            businessId: fixture.business.id,
            branchId: fixture.branchA.id,
            productId: product.id,
          },
        },
      }),
    ).toMatchObject({ isAvailable: true });
    let catalog = await getPublicCatalog({});
    let catalogProducts = catalog?.categories.flatMap((category) => category.products) ?? [];
    expect(catalogProducts.find((item) => item.id === product.id)?.prices[0]?.priceCents).toBe(
      1250,
    );

    await updateCommercialProduct({
      context: ctx,
      productId: product.id,
      data: {
        name: "Produto Comercial Teste Editado",
        description: "Editado pela gestão comercial.",
        categoryId: fixture.product.categoryId ?? "",
        imageUrl: "",
        measurementType: "UNIT",
        price: "15,00",
        minimumOrderQuantity: 1,
        sellingIncrement: 1,
        isActive: false,
        availableBranchIds: [fixture.branchB.id],
      },
    });

    const prices = await prisma.productPrice.findMany({
      where: { productId: product.id },
      orderBy: { startsAt: "asc" },
    });
    expect(prices).toHaveLength(2);
    expect(prices[0].endsAt).not.toBeNull();
    expect(prices[1]).toMatchObject({ priceCents: 1500, endsAt: null });

    const availability = await prisma.productBranchAvailability.findMany({
      where: { productId: product.id },
      orderBy: { branchId: "asc" },
    });
    expect(availability).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          branchId: fixture.branchA.id,
          isAvailable: false,
        }),
        expect.objectContaining({
          branchId: fixture.branchB.id,
          isAvailable: true,
        }),
      ]),
    );
    expect(
      await prisma.auditLog.count({
        where: { entityType: "Product", entityId: product.id },
      }),
    ).toBeGreaterThanOrEqual(3);
    catalog = await getPublicCatalog({});
    catalogProducts = catalog?.categories.flatMap((category) => category.products) ?? [];
    expect(catalogProducts.some((item) => item.id === product.id)).toBe(false);

    await updateCommercialProduct({
      context: ctx,
      productId: product.id,
      data: {
        name: "Produto Comercial Teste Editado",
        description: "Editado pela gestão comercial.",
        categoryId: fixture.product.categoryId ?? "",
        imageUrl: "",
        measurementType: "UNIT",
        price: "15,00",
        minimumOrderQuantity: 1,
        sellingIncrement: 1,
        isActive: true,
        availableBranchIds: [fixture.branchB.id],
      },
    });

    catalog = await getPublicCatalog({ sourceCode: fixture.source.code });
    catalogProducts = catalog?.categories.flatMap((category) => category.products) ?? [];
    expect(catalogProducts.some((item) => item.id === product.id)).toBe(false);

    catalog = await getPublicCatalog({});
    catalogProducts = catalog?.categories.flatMap((category) => category.products) ?? [];
    expect(catalogProducts.find((item) => item.id === product.id)?.prices[0]?.priceCents).toBe(
      1500,
    );

    await prisma.productPrice.updateMany({
      where: { productId: product.id, endsAt: null },
      data: { endsAt: new Date() },
    });

    catalog = await getPublicCatalog({});
    catalogProducts = catalog?.categories.flatMap((category) => category.products) ?? [];
    expect(catalogProducts.some((item) => item.id === product.id)).toBe(false);
  });

  it("agrega dashboard gerencial com semântica de venda, pagamento, tenant e filial", async () => {
    const fixtureA = await createFixture();
    const fixtureB = await createFixture();
    const period = resolveManagementPeriod({
      preset: "custom",
      from: "2026-08-26",
      to: "2026-08-26",
    });
    const previousCompletedAt = new Date("2026-08-25T12:00:00.000Z");
    const completedAt = new Date("2026-08-26T12:00:00.000Z");
    const restrictedManager = await createUser(
      fixtureA.business.id,
      fixtureA.branchA.id,
      "manager.a1@teste.local",
      "MANAGER",
    );

    const customerA1 = await prisma.customer.create({
      data: {
        businessId: fixtureA.business.id,
        name: "Cliente A1",
        normalizedPhone: "5592999990001",
      },
    });
    const customerA2 = await prisma.customer.create({
      data: {
        businessId: fixtureA.business.id,
        name: "Cliente A2",
        normalizedPhone: "5592999990002",
      },
    });

    await createCompletedOrder({
      businessId: fixtureA.business.id,
      branchId: fixtureA.branchA.id,
      productId: fixtureA.product.id,
      customerId: customerA1.id,
      quantity: 1000,
      amountCents: 4200,
      completedAt,
      paymentMethod: "PIX",
    });
    await createCompletedOrder({
      businessId: fixtureA.business.id,
      branchId: fixtureA.branchA.id,
      productId: fixtureA.product.id,
      customerId: customerA1.id,
      quantity: 500,
      amountCents: 2100,
      completedAt: previousCompletedAt,
      paymentMethod: "CASH",
    });
    await createCompletedOrder({
      businessId: fixtureA.business.id,
      branchId: fixtureA.branchB.id,
      productId: fixtureA.product.id,
      customerId: customerA2.id,
      quantity: 500,
      amountCents: 2100,
      completedAt,
      paymentMethod: "CASH",
    });
    await createCompletedOrder({
      businessId: fixtureB.business.id,
      branchId: fixtureB.branchA.id,
      productId: fixtureB.product.id,
      customerId: null,
      quantity: 1000,
      amountCents: 990000,
      completedAt,
      paymentMethod: "CREDIT_CARD",
    });
    await prisma.order.create({
      data: {
        businessId: fixtureA.business.id,
        branchId: fixtureA.branchA.id,
        status: "CANCELLED",
        subtotalCents: 9999,
        totalCents: 9999,
        cancelledAt: completedAt,
        items: {
          create: {
            businessId: fixtureA.business.id,
            productId: fixtureA.product.id,
            productNameSnapshot: fixtureA.product.name,
            measurementTypeSnapshot: "WEIGHT",
            requestedQuantity: 1000,
            priceCentsSnapshot: 4200,
            priceBasisQuantitySnapshot: 1000,
            priceBasisUnitSnapshot: "GRAM",
            estimatedAmountCents: 9999,
          },
        },
      },
    });

    const ownerDashboard = await getManagementDashboard({
      context: context(fixtureA.owner, [
        fixtureA.branchA.id,
        fixtureA.branchB.id,
      ]),
      period,
    });

    expect(ownerDashboard.sales.recognizedRevenueCents).toBe(6300);
    expect(ownerDashboard.sales.completedOrders).toBe(2);
    expect(ownerDashboard.sales.averageTicketCents).toBe(3150);
    expect(ownerDashboard.sales.cancelledOrders).toBe(1);
    expect(ownerDashboard.sales.trend.previousCents).toBe(2100);
    expect(ownerDashboard.payments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "PIX", amountCents: 4200 }),
        expect.objectContaining({ method: "CASH", amountCents: 2100 }),
      ]),
    );
    expect(ownerDashboard.products[0]).toMatchObject({
      productId: fixtureA.product.id,
      quantity: 1500,
      quantityLabel: "1,500 kg",
      revenueCents: 6300,
    });
    expect(ownerDashboard.branches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          branchId: fixtureA.branchA.id,
          revenueCents: 4200,
        }),
        expect.objectContaining({
          branchId: fixtureA.branchB.id,
          revenueCents: 2100,
        }),
      ]),
    );
    expect(ownerDashboard.periodSummary.registeredPaymentsCents).toBe(6300);
    expect(ownerDashboard.customers.purchasedInPeriod).toBe(2);
    expect(ownerDashboard.customers.recurringInPeriod).toBe(1);

    const managerDashboard = await getManagementDashboard({
      context: context(restrictedManager, [fixtureA.branchA.id]),
      period,
    });

    expect(managerDashboard.sales.recognizedRevenueCents).toBe(4200);
    expect(managerDashboard.branches).toHaveLength(1);
    expect(managerDashboard.branches[0].branchId).toBe(fixtureA.branchA.id);

    const invalidBranchDashboard = await getManagementDashboard({
      context: context(restrictedManager, [fixtureA.branchA.id]),
      period,
      branchId: fixtureA.branchB.id,
    });

    expect(invalidBranchDashboard.scope.selectedBranchId).toBeNull();
    expect(invalidBranchDashboard.sales.recognizedRevenueCents).toBe(4200);
  });

  it("controla caixa com abertura única, pagamentos físicos, movimentações, fechamento e isolamento", async () => {
    const fixtureA = await createFixture();
    const fixtureB = await createFixture();
    const attendantCtx = context(fixtureA.attendant, [fixtureA.branchA.id]);
    const ownerCtx = context(fixtureA.owner, [fixtureA.branchA.id]);
    await prisma.stockMovement.create({
      data: {
        businessId: fixtureA.business.id,
        branchId: fixtureA.branchA.id,
        productId: fixtureA.product.id,
        type: "PURCHASE",
        quantityDelta: 5000,
        reason: "Estoque para teste de caixa",
      },
    });

    const concurrentOpen = await Promise.allSettled([
      openCashSession({
        context: attendantCtx,
        branchId: fixtureA.branchA.id,
        openingAmountCents: 20000,
        idempotencyKey: "cash-open-a",
      }),
      openCashSession({
        context: attendantCtx,
        branchId: fixtureA.branchA.id,
        openingAmountCents: 20000,
        idempotencyKey: "cash-open-b",
      }),
    ]);
    expect(
      concurrentOpen.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);

    const session = await prisma.cashSession.findFirstOrThrow({
      where: {
        businessId: fixtureA.business.id,
        branchId: fixtureA.branchA.id,
        status: "OPEN",
      },
    });

    await createPosSale({
      context: attendantCtx,
      branchId: fixtureA.branchA.id,
      productId: fixtureA.product.id,
      quantity: 1000,
      paymentMethod: "CASH",
      idempotencyKey: "cash-sale",
    });
    await createPosSale({
      context: attendantCtx,
      branchId: fixtureA.branchA.id,
      productId: fixtureA.product.id,
      quantity: 500,
      paymentMethod: "PIX",
      idempotencyKey: "pix-sale",
    });

    const mixedOrder = await prisma.order.create({
      data: {
        businessId: fixtureA.business.id,
        branchId: fixtureA.branchA.id,
        status: "COMPLETED",
        subtotalCents: 10000,
        totalCents: 10000,
        completedAt: new Date(),
        items: {
          create: {
            businessId: fixtureA.business.id,
            productId: fixtureA.product.id,
            productNameSnapshot: fixtureA.product.name,
            measurementTypeSnapshot: "WEIGHT",
            requestedQuantity: 1000,
            actualQuantity: 1000,
            priceCentsSnapshot: 10000,
            priceBasisQuantitySnapshot: 1000,
            priceBasisUnitSnapshot: "GRAM",
            estimatedAmountCents: 10000,
            finalAmountCents: 10000,
          },
        },
        payments: {
          create: [
            {
              businessId: fixtureA.business.id,
              branchId: fixtureA.branchA.id,
              cashSessionId: session.id,
              method: "CASH",
              amountCents: 4000,
            },
            {
              businessId: fixtureA.business.id,
              branchId: fixtureA.branchA.id,
              cashSessionId: session.id,
              method: "PIX",
              amountCents: 6000,
            },
          ],
        },
      },
    });
    expect(mixedOrder.totalCents).toBe(10000);

    await createCashMovement({
      context: attendantCtx,
      cashSessionId: session.id,
      type: "SUPPLY",
      amountCents: 10000,
      reason: "Troco adicional",
      idempotencyKey: "supply-1",
    });
    await createCashMovement({
      context: attendantCtx,
      cashSessionId: session.id,
      type: "WITHDRAWAL",
      amountCents: 3000,
      reason: "Retirada de excesso",
      idempotencyKey: "withdrawal-1",
    });
    await createCashMovement({
      context: attendantCtx,
      cashSessionId: session.id,
      type: "SUPPLY",
      amountCents: 10000,
      reason: "Troco adicional",
      idempotencyKey: "supply-1",
    });
    expect(
      await prisma.cashMovement.count({
        where: { cashSessionId: session.id, type: "SUPPLY" },
      }),
    ).toBe(1);

    const closeResult = await closeCashSession({
      context: ownerCtx,
      cashSessionId: session.id,
      countedCashCents: 35000,
      closingNote: "Faltou troco na contagem final",
      idempotencyKey: "close-1",
    });
    expect(closeResult).toMatchObject({
      expectedCashCents: 35200,
      countedCashCents: 35000,
      differenceCents: -200,
    });

    const closed = await prisma.cashSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    expect(closed).toMatchObject({
      status: "CLOSED",
      expectedCashCents: 35200,
      countedCashCents: 35000,
      differenceCents: -200,
    });

    await expect(
      closeCashSession({
        context: ownerCtx,
        cashSessionId: session.id,
        countedCashCents: 35000,
        closingNote: "Faltou troco na contagem final",
        idempotencyKey: "close-2",
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });
    await expect(
      createCashMovement({
        context: attendantCtx,
        cashSessionId: session.id,
        type: "SUPPLY",
        amountCents: 100,
        reason: "Ajuste tardio",
        idempotencyKey: "late-supply",
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });
    await expect(
      openCashSession({
        context: context(fixtureA.attendant, [fixtureA.branchA.id]),
        branchId: fixtureB.branchA.id,
        openingAmountCents: 0,
        idempotencyKey: "cross-business-cash",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      openCashSession({
        context: context(fixtureA.attendant, [fixtureA.branchA.id]),
        branchId: fixtureA.branchB.id,
        openingAmountCents: 0,
        idempotencyKey: "cross-branch-cash",
      }),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_ERROR" });
    expect(
      await prisma.auditLog.count({
        where: { entityType: "CashSession", entityId: session.id },
      }),
    ).toBe(2);
    expect(
      await prisma.auditLog.count({
        where: { entityType: "CashMovement", branchId: fixtureA.branchA.id },
      }),
    ).toBe(2);
  });
});

async function openFixtureCashSession(
  fixture: Awaited<ReturnType<typeof createFixture>>,
  ctx: AuthContext,
) {
  return openCashSession({
    context: ctx,
    branchId: fixture.branchA.id,
    openingAmountCents: 0,
    idempotencyKey: `cash-${crypto.randomUUID()}`,
  });
}

async function createCompletedOrder(input: {
  businessId: string;
  branchId: string;
  productId: string;
  customerId: string | null;
  quantity: number;
  amountCents: number;
  completedAt: Date;
  paymentMethod: "CASH" | "PIX" | "DEBIT_CARD" | "CREDIT_CARD";
}) {
  return prisma.order.create({
    data: {
      businessId: input.businessId,
      branchId: input.branchId,
      customerId: input.customerId,
      status: "COMPLETED",
      salesChannel: "DIGITAL",
      subtotalCents: input.amountCents,
      totalCents: input.amountCents,
      completedAt: input.completedAt,
      createdAt: input.completedAt,
      items: {
        create: {
          businessId: input.businessId,
          productId: input.productId,
          productNameSnapshot: "Queijo regional",
          measurementTypeSnapshot: "WEIGHT",
          requestedQuantity: input.quantity,
          actualQuantity: input.quantity,
          priceCentsSnapshot: 4200,
          priceBasisQuantitySnapshot: 1000,
          priceBasisUnitSnapshot: "GRAM",
          estimatedAmountCents: input.amountCents,
          finalAmountCents: input.amountCents,
        },
      },
      payments: {
        create: {
          businessId: input.businessId,
          branchId: input.branchId,
          method: input.paymentMethod,
          amountCents: input.amountCents,
          createdAt: input.completedAt,
        },
      },
    },
  });
}
