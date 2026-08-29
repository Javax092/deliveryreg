import { prisma } from "@/db/prisma";
import { writeAuditLog } from "@/modules/audit/audit";
import { assertBranchAccess } from "@/modules/business/tenant";
import { buildTransferMovements } from "@/modules/inventory/ledger";
import { createStockMovement } from "@/modules/inventory/service";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertPermission } from "@/modules/shared/auth/permissions";
import { AppError } from "@/modules/shared/errors/app-error";

export async function adjustInventory(input: {
  context: AuthContext;
  branchId: string;
  productId: string;
  quantityDelta: number;
  reason: string;
}) {
  assertPermission(input.context, "inventory:write");
  assertBranchAccess(input.context, {
    businessId: input.context.businessId,
    branchId: input.branchId
  });

  if (input.reason.trim().length < 3) {
    throw new AppError("VALIDATION_ERROR");
  }

  return prisma.$transaction(async (tx) => {
    const movement = await createStockMovement({
      tx,
      businessId: input.context.businessId,
      branchId: input.branchId,
      productId: input.productId,
      actorUserId: input.context.userId,
      type: "ADJUSTMENT",
      quantityDelta: input.quantityDelta,
      reason: input.reason.trim(),
      sourceType: "InventoryAdjustment"
    });

    await writeAuditLog({
      tx,
      businessId: input.context.businessId,
      branchId: input.branchId,
      actorUserId: input.context.userId,
      action: "STOCK_ADJUSTED",
      entityType: "StockMovement",
      entityId: movement.id,
      after: {
        productId: input.productId,
        quantityDelta: input.quantityDelta,
        reason: input.reason.trim()
      }
    });

    return movement;
  });
}

export async function transferInventory(input: {
  context: AuthContext;
  fromBranchId: string;
  toBranchId: string;
  productId: string;
  quantity: number;
  reason: string;
}) {
  assertPermission(input.context, "inventory:write");

  if (input.fromBranchId === input.toBranchId) {
    throw new AppError("VALIDATION_ERROR");
  }

  assertBranchAccess(input.context, {
    businessId: input.context.businessId,
    branchId: input.fromBranchId
  });
  assertBranchAccess(input.context, {
    businessId: input.context.businessId,
    branchId: input.toBranchId
  });

  const movements = buildTransferMovements(input.quantity);

  return prisma.$transaction(async (tx) => {
    const debit = await createStockMovement({
      tx,
      businessId: input.context.businessId,
      branchId: input.fromBranchId,
      productId: input.productId,
      actorUserId: input.context.userId,
      type: "TRANSFER",
      quantityDelta: movements.debit.quantityDelta,
      reason: input.reason,
      sourceType: "StockTransfer"
    });

    const credit = await createStockMovement({
      tx,
      businessId: input.context.businessId,
      branchId: input.toBranchId,
      productId: input.productId,
      actorUserId: input.context.userId,
      type: "TRANSFER",
      quantityDelta: movements.credit.quantityDelta,
      reason: input.reason,
      sourceType: "StockTransfer"
    });

    await writeAuditLog({
      tx,
      businessId: input.context.businessId,
      actorUserId: input.context.userId,
      action: "STOCK_TRANSFERRED",
      entityType: "StockMovement",
      entityId: debit.id,
      after: {
        fromBranchId: input.fromBranchId,
        toBranchId: input.toBranchId,
        productId: input.productId,
        quantity: input.quantity,
        creditMovementId: credit.id
      }
    });

    return { debit, credit };
  });
}
