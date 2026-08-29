import type { Prisma } from "@prisma/client";

import { assertSufficientInventory, assertStockMovement } from "@/modules/inventory/ledger";

export async function getAvailableQuantity(input: {
  tx: Prisma.TransactionClient;
  businessId: string;
  branchId: string;
  productId: string;
}): Promise<number> {
  const aggregate = await input.tx.stockMovement.aggregate({
    where: {
      businessId: input.businessId,
      branchId: input.branchId,
      productId: input.productId
    },
    _sum: {
      quantityDelta: true
    }
  });

  return aggregate._sum.quantityDelta ?? 0;
}

export async function lockInventoryBalance(input: {
  tx: Prisma.TransactionClient;
  businessId: string;
  branchId: string;
  productId: string;
}): Promise<void> {
  await input.tx.$executeRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(${input.businessId}),
      hashtext(${`${input.branchId}:${input.productId}`})
    )
  `;
}

export async function createStockMovement(input: {
  tx: Prisma.TransactionClient;
  businessId: string;
  branchId: string;
  productId: string;
  actorUserId?: string;
  type: "PURCHASE" | "SALE" | "LOSS" | "ADJUSTMENT" | "TRANSFER" | "RETURN";
  quantityDelta: number;
  reason: string;
  sourceType?: string;
  sourceId?: string;
  idempotencyKeyId?: string;
}) {
  assertStockMovement({
    type: input.type,
    quantityDelta: input.quantityDelta
  });

  if (input.quantityDelta < 0) {
    await lockInventoryBalance(input);
    const availableQuantity = await getAvailableQuantity(input);
    assertSufficientInventory(availableQuantity, Math.abs(input.quantityDelta));
  }

  return input.tx.stockMovement.create({
    data: {
      businessId: input.businessId,
      branchId: input.branchId,
      productId: input.productId,
      actorUserId: input.actorUserId,
      type: input.type,
      quantityDelta: input.quantityDelta,
      reason: input.reason,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      idempotencyKeyId: input.idempotencyKeyId
    }
  });
}
