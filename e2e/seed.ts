import { PrismaClient, type InternalRole } from "@prisma/client";

import { hashPassword } from "../src/modules/identity/password";

const prisma = new PrismaClient();
const password = "senha-e2e-local-2026";

const ids = {
  businessA: "e2e_business_a",
  businessB: "e2e_business_b",
  branchA1: "e2e_branch_a1",
  branchA2: "e2e_branch_a2",
  branchB1: "e2e_branch_b1",
  categoryA: "e2e_category_a",
  categoryB: "e2e_category_b",
  weightProduct: "e2e_product_weight",
  unitProduct: "e2e_product_unit",
  businessBProduct: "e2e_product_business_b",
  sourceA1: "e2e_source_a1",
  sourceA2: "e2e_source_a2",
  alvoradaSourceA1: "e2e_source_alvorada_a1",
  alvoradaSourceA2: "e2e_source_alvorada_a2"
};

export async function resetE2eDatabase() {
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

async function createUser(input: {
  businessId: string;
  branchIds: string[];
  email: string;
  name: string;
  role: InternalRole;
  isActive?: boolean;
}) {
  const user = await prisma.user.create({
    data: {
      businessId: input.businessId,
      email: input.email,
      name: input.name,
      role: input.role,
      isActive: input.isActive ?? true,
      passwordHash: await hashPassword(password)
    }
  });

  await prisma.userBranchAccess.createMany({
    data: input.branchIds.map((branchId) => ({
      userId: user.id,
      branchId
    }))
  });

  return user;
}

export async function seedE2eDatabase() {
  await resetE2eDatabase();

  await prisma.business.create({
    data: {
      id: ids.businessA,
      name: "E2E Business A",
      timezone: "America/Manaus",
      branches: {
        create: [
          { id: ids.branchA1, name: "E2E Filial A1" },
          { id: ids.branchA2, name: "E2E Filial A2" }
        ]
      }
    }
  });

  await prisma.business.create({
    data: {
      id: ids.businessB,
      name: "E2E Business B",
      timezone: "America/Manaus",
      branches: {
        create: [{ id: ids.branchB1, name: "E2E Filial B1" }]
      }
    }
  });

  await Promise.all([
    createUser({
      businessId: ids.businessA,
      branchIds: [ids.branchA1, ids.branchA2],
      email: "owner.a@e2e.local",
      name: "E2E Owner A",
      role: "OWNER"
    }),
    createUser({
      businessId: ids.businessA,
      branchIds: [ids.branchA1, ids.branchA2],
      email: "manager.a@e2e.local",
      name: "E2E Manager A",
      role: "MANAGER"
    }),
    createUser({
      businessId: ids.businessA,
      branchIds: [ids.branchA1],
      email: "attendant.a1@e2e.local",
      name: "E2E Attendant A1",
      role: "ATTENDANT"
    }),
    createUser({
      businessId: ids.businessA,
      branchIds: [ids.branchA1],
      email: "delivery.a1@e2e.local",
      name: "E2E Delivery A1",
      role: "DELIVERY"
    }),
    createUser({
      businessId: ids.businessA,
      branchIds: [ids.branchA1],
      email: "delivery.a1b@e2e.local",
      name: "E2E Delivery A1 Secundario",
      role: "DELIVERY"
    }),
    createUser({
      businessId: ids.businessA,
      branchIds: [ids.branchA2],
      email: "delivery.a2@e2e.local",
      name: "E2E Delivery A2",
      role: "DELIVERY"
    }),
    createUser({
      businessId: ids.businessA,
      branchIds: [ids.branchA1],
      email: "inactive.a@e2e.local",
      name: "E2E Inactive A",
      role: "ATTENDANT",
      isActive: false
    }),
    createUser({
      businessId: ids.businessB,
      branchIds: [ids.branchB1],
      email: "owner.b@e2e.local",
      name: "E2E Owner B",
      role: "OWNER"
    })
  ]);

  await prisma.productCategory.createMany({
    data: [
      {
        id: ids.categoryA,
        businessId: ids.businessA,
        name: "E2E Produtos",
        slug: "e2e-produtos",
        sortOrder: 1
      },
      {
        id: ids.categoryB,
        businessId: ids.businessB,
        name: "E2E Produtos B",
        slug: "e2e-produtos-b",
        sortOrder: 1
      }
    ]
  });

  await prisma.product.createMany({
    data: [
      {
        id: ids.weightProduct,
        businessId: ids.businessA,
        categoryId: ids.categoryA,
        name: "E2E Queijo por peso",
        slug: "e2e-queijo-peso",
        description: "Produto E2E vendido por peso.",
        measurementType: "WEIGHT",
        baseUnit: "GRAM",
        sellingIncrement: 50,
        minimumOrderQuantity: 250
      },
      {
        id: ids.unitProduct,
        businessId: ids.businessA,
        categoryId: ids.categoryA,
        name: "E2E Produto unitario",
        slug: "e2e-produto-unitario",
        description: "Produto E2E vendido por unidade.",
        measurementType: "UNIT",
        baseUnit: "UNIT",
        sellingIncrement: 1,
        minimumOrderQuantity: 1
      },
      {
        id: ids.businessBProduct,
        businessId: ids.businessB,
        categoryId: ids.categoryB,
        name: "E2E Produto exclusivo B",
        slug: "e2e-produto-b",
        measurementType: "UNIT",
        baseUnit: "UNIT",
        sellingIncrement: 1,
        minimumOrderQuantity: 1
      }
    ]
  });

  await prisma.productPrice.createMany({
    data: [
      {
        businessId: ids.businessA,
        productId: ids.weightProduct,
        priceCents: 4200,
        basisQuantity: 1000,
        basisUnit: "GRAM"
      },
      {
        businessId: ids.businessA,
        productId: ids.unitProduct,
        priceCents: 1200,
        basisQuantity: 1,
        basisUnit: "UNIT"
      },
      {
        businessId: ids.businessB,
        productId: ids.businessBProduct,
        priceCents: 9900,
        basisQuantity: 1,
        basisUnit: "UNIT"
      }
    ]
  });

  await prisma.productBranchAvailability.createMany({
    data: [
      { businessId: ids.businessA, branchId: ids.branchA1, productId: ids.weightProduct },
      { businessId: ids.businessA, branchId: ids.branchA2, productId: ids.weightProduct },
      { businessId: ids.businessA, branchId: ids.branchA1, productId: ids.unitProduct },
      { businessId: ids.businessA, branchId: ids.branchA2, productId: ids.unitProduct },
      { businessId: ids.businessB, branchId: ids.branchB1, productId: ids.businessBProduct }
    ]
  });

  await prisma.leadSource.createMany({
    data: [
      {
        id: ids.sourceA1,
        businessId: ids.businessA,
        branchId: ids.branchA1,
        code: "qr-e2e-a1",
        label: "QR E2E A1"
      },
      {
        id: ids.sourceA2,
        businessId: ids.businessA,
        branchId: ids.branchA2,
        code: "qr-e2e-a2",
        label: "QR E2E A2"
      },
      {
        id: ids.alvoradaSourceA1,
        businessId: ids.businessA,
        branchId: ids.branchA1,
        code: "qr-alvorada-1-01",
        label: "QR Code Alvorada 1 - 01"
      },
      {
        id: ids.alvoradaSourceA2,
        businessId: ids.businessA,
        branchId: ids.branchA2,
        code: "qr-alvorada-2-01",
        label: "QR Code Alvorada 2 - 01"
      }
    ]
  });

  await prisma.deliveryZone.createMany({
    data: [
      {
        businessId: ids.businessA,
        branchId: ids.branchA1,
        name: "Centro",
        normalizedName: "centro",
        feeCents: 800,
        minimumOrderCents: 100
      },
      {
        businessId: ids.businessA,
        branchId: ids.branchA2,
        name: "Centro",
        normalizedName: "centro",
        feeCents: 800,
        minimumOrderCents: 100
      }
    ]
  });

  await prisma.stockMovement.createMany({
    data: [
      {
        businessId: ids.businessA,
        branchId: ids.branchA1,
        productId: ids.weightProduct,
        type: "PURCHASE",
        quantityDelta: 10000,
        reason: "Carga E2E A1 peso"
      },
      {
        businessId: ids.businessA,
        branchId: ids.branchA1,
        productId: ids.unitProduct,
        type: "PURCHASE",
        quantityDelta: 50,
        reason: "Carga E2E A1 unidade"
      },
      {
        businessId: ids.businessA,
        branchId: ids.branchA2,
        productId: ids.weightProduct,
        type: "PURCHASE",
        quantityDelta: 8000,
        reason: "Carga E2E A2 peso"
      },
      {
        businessId: ids.businessB,
        branchId: ids.branchB1,
        productId: ids.businessBProduct,
        type: "PURCHASE",
        quantityDelta: 10,
        reason: "Carga E2E B"
      }
    ]
  });

  const customerA1 = await prisma.customer.create({
    data: {
      businessId: ids.businessA,
      name: "E2E Cliente Gestao A1",
      normalizedPhone: "5592999913001"
    }
  });
  const customerA2 = await prisma.customer.create({
    data: {
      businessId: ids.businessA,
      name: "E2E Cliente Gestao A2",
      normalizedPhone: "5592999913002"
    }
  });

  await createManagementSale({
    businessId: ids.businessA,
    branchId: ids.branchA1,
    productId: ids.weightProduct,
    customerId: customerA1.id,
    productName: "E2E Queijo por peso",
    measurementType: "WEIGHT",
    quantity: 1000,
    amountCents: 4200,
    completedAt: new Date("2026-08-26T12:00:00.000Z"),
    paymentMethod: "PIX"
  });
  await createManagementSale({
    businessId: ids.businessA,
    branchId: ids.branchA2,
    productId: ids.unitProduct,
    customerId: customerA2.id,
    productName: "E2E Produto unitario",
    measurementType: "UNIT",
    quantity: 2,
    amountCents: 2400,
    completedAt: new Date("2026-08-26T13:00:00.000Z"),
    paymentMethod: "CASH"
  });
  await createManagementSale({
    businessId: ids.businessA,
    branchId: ids.branchA1,
    productId: ids.weightProduct,
    customerId: customerA1.id,
    productName: "E2E Queijo por peso",
    measurementType: "WEIGHT",
    quantity: 500,
    amountCents: 2100,
    completedAt: new Date("2026-08-25T12:00:00.000Z"),
    paymentMethod: "DEBIT_CARD"
  });
  await createManagementSale({
    businessId: ids.businessB,
    branchId: ids.branchB1,
    productId: ids.businessBProduct,
    customerId: null,
    productName: "E2E Produto exclusivo B",
    measurementType: "UNIT",
    quantity: 1,
    amountCents: 9900,
    completedAt: new Date("2026-08-26T12:00:00.000Z"),
    paymentMethod: "CREDIT_CARD"
  });
}

async function createManagementSale(input: {
  businessId: string;
  branchId: string;
  productId: string;
  customerId: string | null;
  productName: string;
  measurementType: "WEIGHT" | "UNIT";
  quantity: number;
  amountCents: number;
  completedAt: Date;
  paymentMethod: "CASH" | "PIX" | "DEBIT_CARD" | "CREDIT_CARD";
}) {
  await prisma.order.create({
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
          productNameSnapshot: input.productName,
          measurementTypeSnapshot: input.measurementType,
          requestedQuantity: input.quantity,
          actualQuantity: input.quantity,
          priceCentsSnapshot: input.measurementType === "WEIGHT" ? 4200 : 1200,
          priceBasisQuantitySnapshot: input.measurementType === "WEIGHT" ? 1000 : 1,
          priceBasisUnitSnapshot: input.measurementType === "WEIGHT" ? "GRAM" : "UNIT",
          estimatedAmountCents: input.amountCents,
          finalAmountCents: input.amountCents
        }
      },
      payments: {
        create: {
          businessId: input.businessId,
          branchId: input.branchId,
          method: input.paymentMethod,
          amountCents: input.amountCents,
          createdAt: input.completedAt
        }
      }
    }
  });
}

seedE2eDatabase()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
