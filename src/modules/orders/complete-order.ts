import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { writeAuditLog } from "@/modules/audit/audit";
import { requireOpenCashSessionForPayment } from "@/modules/cash/service";
import { createStockMovement } from "@/modules/inventory/service";
import { assertOrderTransition } from "@/modules/orders/order-state";
import { assertPermission } from "@/modules/shared/auth/permissions";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertBranchAccess } from "@/modules/business/tenant";
import { AppError } from "@/modules/shared/errors/app-error";
import { hashRequestPayload, lockIdempotencyOperation } from "@/modules/shared/idempotency";

export async function completeOrder(input: {
  context: AuthContext;
  orderId: string;
  idempotencyKey: string;
  paymentMethod?: "CASH" | "PIX" | "DEBIT_CARD" | "CREDIT_CARD";
}) {
  assertPermission(input.context, "orders:complete");

  return prisma.$transaction(async (tx) => {
    await lockIdempotencyOperation({
      tx,
      businessId: input.context.businessId,
      operation: "complete-order",
      key: input.idempotencyKey
    });

    const requestHash = hashRequestPayload({
      orderId: input.orderId,
      userId: input.context.userId
    });

    const existingKey = await tx.idempotencyKey.findUnique({
      where: {
        businessId_operation_key: {
          businessId: input.context.businessId,
          operation: "complete-order",
          key: input.idempotencyKey
        }
      }
    });

    if (existingKey?.responseJson) {
      return existingKey.responseJson;
    }

    if (existingKey && existingKey.requestHash !== requestHash) {
      throw new AppError("CONFLICT", {
        message: "Idempotency key reused with different payload."
      });
    }

    const key =
      existingKey ??
      (await tx.idempotencyKey.create({
        data: {
          businessId: input.context.businessId,
          operation: "complete-order",
          key: input.idempotencyKey,
          requestHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }));

    const order = await tx.order.findFirst({
      where: {
        id: input.orderId,
        businessId: input.context.businessId
      },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new AppError("NOT_FOUND");
    }

    assertBranchAccess(input.context, {
      businessId: order.businessId,
      branchId: order.branchId
    });
    assertOrderTransition(order.status, "COMPLETED");
    const cashSession = await requireOpenCashSessionForPayment({
      tx,
      context: input.context,
      branchId: order.branchId
    });

    const completion = await tx.order.updateMany({
      where: {
        id: order.id,
        businessId: order.businessId,
        status: order.status
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date()
      }
    });

    if (completion.count !== 1) {
      throw new AppError("CONFLICT", {
        message: "Esse pedido já foi finalizado."
      });
    }

    for (const item of order.items) {
      const quantity = item.actualQuantity ?? item.requestedQuantity;
      await createStockMovement({
        tx,
        businessId: order.businessId,
        branchId: order.branchId,
        productId: item.productId,
        actorUserId: input.context.userId,
        type: "SALE",
        quantityDelta: -quantity,
        reason: "Baixa de estoque por conclusão de pedido",
        sourceType: "Order",
        sourceId: order.id,
        idempotencyKeyId: key.id
      });
    }

    await tx.payment.create({
      data: {
        businessId: order.businessId,
        branchId: order.branchId,
        orderId: order.id,
        cashSessionId: cashSession.id,
        actorUserId: input.context.userId,
        method: input.paymentMethod ?? "CASH",
        amountCents: order.totalCents
      }
    });

    const completed = await tx.order.findUniqueOrThrow({
      where: {
        id: order.id
      }
    });

    await tx.orderStatusHistory.create({
      data: {
        businessId: order.businessId,
        orderId: order.id,
        actorUserId: input.context.userId,
        fromStatus: order.status,
        toStatus: "COMPLETED"
      }
    });

    await writeAuditLog({
      tx,
      businessId: order.businessId,
      branchId: order.branchId,
      actorUserId: input.context.userId,
      action: "ORDER_COMPLETED",
      entityType: "Order",
      entityId: order.id,
      before: { status: order.status } satisfies Prisma.InputJsonValue,
      after: { status: completed.status } satisfies Prisma.InputJsonValue
    });

    const response = {
      orderId: completed.id,
      status: completed.status
    };

    await tx.idempotencyKey.update({
      where: {
        id: key.id
      },
      data: {
        responseJson: response
      }
    });

    return response;
  });
}
