import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { writeAuditLog } from "@/modules/audit/audit";
import { assertBranchAccess } from "@/modules/business/tenant";
import { assertOrderTransition } from "@/modules/orders/order-state";
import { assertCanConfirmActualQuantity } from "@/modules/orders/weighing";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertPermission } from "@/modules/shared/auth/permissions";
import { AppError } from "@/modules/shared/errors/app-error";
import {
  hashRequestPayload,
  lockIdempotencyOperation,
} from "@/modules/shared/idempotency";

export async function transitionOperationalOrder(input: {
  context: AuthContext;
  orderId: string;
  toStatus: Exclude<OrderStatus, "COMPLETED">;
  reason?: string;
}) {
  assertPermission(input.context, "orders:write");

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: input.orderId,
        businessId: input.context.businessId,
      },
    });

    if (!order) {
      throw new AppError("NOT_FOUND");
    }

    assertBranchAccess(input.context, {
      businessId: order.businessId,
      branchId: order.branchId,
    });

    assertOrderTransition(order.status, input.toStatus);

    if (input.toStatus === "READY") {
      const pendingWeightedItems = await tx.orderItem.count({
        where: {
          orderId: order.id,
          businessId: order.businessId,
          measurementTypeSnapshot: "WEIGHT",
          actualQuantity: null,
        },
      });

      if (pendingWeightedItems > 0) {
        throw new AppError("VALIDATION_ERROR", {
          message:
            "Weighted order items must be confirmed before marking the order ready.",
        });
      }
    }

    const updated = await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: input.toStatus,
        cancelledAt:
          input.toStatus === "CANCELLED" ? new Date() : order.cancelledAt,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        businessId: order.businessId,
        orderId: order.id,
        actorUserId: input.context.userId,
        fromStatus: order.status,
        toStatus: input.toStatus,
        reason: input.reason,
      },
    });

    if (input.toStatus === "CANCELLED") {
      await writeAuditLog({
        tx,
        businessId: order.businessId,
        branchId: order.branchId,
        actorUserId: input.context.userId,
        action: "ORDER_CANCELLED",
        entityType: "Order",
        entityId: order.id,
        before: {
          status: order.status,
        } satisfies Prisma.InputJsonValue,
        after: {
          status: updated.status,
        } satisfies Prisma.InputJsonValue,
        metadata: input.reason
          ? ({
              reason: input.reason,
            } satisfies Prisma.InputJsonValue)
          : undefined,
      });
    }

    return updated;
  });
}

export async function confirmActualWeight(input: {
  context: AuthContext;
  orderItemId: string;
  actualQuantity: number;
  idempotencyKey: string;
}) {
  assertPermission(input.context, "orders:write");

  return prisma.$transaction(async (tx) => {
    await lockIdempotencyOperation({
      tx,
      businessId: input.context.businessId,
      operation: "confirm-actual-weight",
      key: input.idempotencyKey,
    });

    const requestHash = hashRequestPayload({
      orderItemId: input.orderItemId,
      actualQuantity: input.actualQuantity,
    });

    const existingKey = await tx.idempotencyKey.findUnique({
      where: {
        businessId_operation_key: {
          businessId: input.context.businessId,
          operation: "confirm-actual-weight",
          key: input.idempotencyKey,
        },
      },
    });

    if (existingKey?.responseJson) {
      return existingKey.responseJson;
    }

    if (existingKey && existingKey.requestHash !== requestHash) {
      throw new AppError("CONFLICT");
    }

    const key =
      existingKey ??
      (await tx.idempotencyKey.create({
        data: {
          businessId: input.context.businessId,
          operation: "confirm-actual-weight",
          key: input.idempotencyKey,
          requestHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }));

    const item = await tx.orderItem.findFirst({
      where: {
        id: input.orderItemId,
        businessId: input.context.businessId,
      },
      include: {
        order: true,
      },
    });

    if (!item) {
      throw new AppError("NOT_FOUND");
    }

    assertBranchAccess(input.context, {
      businessId: item.order.businessId,
      branchId: item.order.branchId,
    });

    if (item.measurementTypeSnapshot !== "WEIGHT") {
      throw new AppError("VALIDATION_ERROR", {
        message: "Actual weight confirmation only applies to weighted items.",
      });
    }

    if (
      item.order.status === "COMPLETED" ||
      item.order.status === "CANCELLED"
    ) {
      throw new AppError("INVALID_STATE_TRANSITION");
    }

    /*
     * A quantidade real representa o peso efetivamente separado.
     *
     * Exemplo:
     * cliente pediu 550 g
     * peso real = 555 g
     *
     * requestedQuantity permanece 550.
     * actualQuantity recebe 555.
     *
     * O peso real será utilizado operacionalmente e para estoque,
     * mas NÃO altera o preço já contratado pelo cliente.
     */
    const actualQuantity = assertCanConfirmActualQuantity({
      currentActualQuantity: item.actualQuantity,
      actualQuantity: input.actualQuantity,
    });

    /*
     * O valor comercial do pedido permanece baseado na quantidade
     * solicitada originalmente.
     *
     * Portanto:
     *
     * requestedQuantity = 550 g
     * actualQuantity    = 555 g
     *
     * estimatedAmountCents = preço dos 550 g
     * finalAmountCents     = mesmo preço dos 550 g
     */
    const finalAmountCents = item.estimatedAmountCents;

    const updateResult = await tx.orderItem.updateMany({
      where: {
        id: item.id,
        businessId: input.context.businessId,
        actualQuantity: null,
      },
      data: {
        actualQuantity,
        finalAmountCents,
      },
    });

    if (updateResult.count !== 1) {
      throw new AppError("CONFLICT", {
        message: "Actual quantity has already been confirmed.",
      });
    }

    const updated = await tx.orderItem.findUniqueOrThrow({
      where: {
        id: item.id,
      },
    });

    /*
     * estimatedAmountCents e finalAmountCents devem permanecer
     * comercialmente equivalentes após a pesagem.
     *
     * Isso garante que a pesagem não aumente o valor informado
     * ao cliente durante o pedido.
     */
    const totals = await tx.orderItem.aggregate({
      where: {
        orderId: item.orderId,
      },
      _sum: {
        estimatedAmountCents: true,
        finalAmountCents: true,
      },
    });

    await tx.order.update({
      where: {
        id: item.orderId,
      },
      data: {
        subtotalCents:
          totals._sum.estimatedAmountCents ?? item.order.subtotalCents,

        totalCents: totals._sum.finalAmountCents ?? item.order.totalCents,
      },
    });

    await writeAuditLog({
      tx,
      businessId: item.order.businessId,
      branchId: item.order.branchId,
      actorUserId: input.context.userId,
      action: "WEIGHT_CONFIRMED",
      entityType: "OrderItem",
      entityId: item.id,

      before: {
        requestedQuantity: item.requestedQuantity,
        actualQuantity: item.actualQuantity,
        finalAmountCents: item.finalAmountCents,
      } satisfies Prisma.InputJsonValue,

      after: {
        requestedQuantity: item.requestedQuantity,
        actualQuantity,
        finalAmountCents,
      } satisfies Prisma.InputJsonValue,
    });

    const response = {
      orderItemId: updated.id,
      requestedQuantity: updated.requestedQuantity,
      actualQuantity: updated.actualQuantity,
      estimatedAmountCents: updated.estimatedAmountCents,
      finalAmountCents: updated.finalAmountCents,
    };

    await tx.idempotencyKey.update({
      where: {
        id: key.id,
      },
      data: {
        responseJson: response,
      },
    });

    return response;
  });
}
