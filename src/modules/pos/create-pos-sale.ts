import type { PaymentMethod, Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { writeAuditLog } from "@/modules/audit/audit";
import { assertBranchAccess } from "@/modules/business/tenant";
import { requireOpenCashSessionForPayment } from "@/modules/cash/service";
import { createStockMovement } from "@/modules/inventory/service";
import { priceMeasuredOrderItem } from "@/modules/orders/pricing";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertPermission } from "@/modules/shared/auth/permissions";
import { AppError } from "@/modules/shared/errors/app-error";
import {
  hashRequestPayload,
  lockIdempotencyOperation,
} from "@/modules/shared/idempotency";

export async function createPosSale(input: {
  context: AuthContext;
  branchId: string;
  productId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
}) {
  assertPermission(input.context, "orders:complete");

  assertBranchAccess(input.context, {
    businessId: input.context.businessId,
    branchId: input.branchId,
  });

  const requestHash = hashRequestPayload({
    branchId: input.branchId,
    productId: input.productId,
    quantity: input.quantity,
    paymentMethod: input.paymentMethod,
  });

  return prisma.$transaction(async (tx) => {
    await lockIdempotencyOperation({
      tx,
      businessId: input.context.businessId,
      operation: "create-pos-sale",
      key: input.idempotencyKey,
    });

    const existingKey = await tx.idempotencyKey.findUnique({
      where: {
        businessId_operation_key: {
          businessId: input.context.businessId,
          operation: "create-pos-sale",
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
          operation: "create-pos-sale",
          key: input.idempotencyKey,
          requestHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }));

    const cashSession = await requireOpenCashSessionForPayment({
      tx,
      context: input.context,
      branchId: input.branchId,
    });

    const product = await tx.product.findFirst({
      where: {
        id: input.productId,
        businessId: input.context.businessId,
        isActive: true,
        availability: {
          some: {
            branchId: input.branchId,
            isAvailable: true,
          },
        },
      },
      include: {
        prices: {
          where: {
            endsAt: null,
          },
          orderBy: {
            startsAt: "desc",
          },
          take: 1,
        },
      },
    });

    const price = product?.prices[0];

    if (!product || !price) {
      throw new AppError("NOT_FOUND");
    }

    /*
     * No PDV a quantidade representa aquilo que foi efetivamente
     * pesado/medido.
     *
     * Por isso não aplicamos minimumOrderQuantity nem sellingIncrement.
     *
     * Exemplo:
     * queijo = R$ 42/kg
     * balança = 527 g
     *
     * quantidade comercial = 527 g
     * quantidade real      = 527 g
     * cobrança             = proporcional a 527 g
     * estoque              = -527 g
     */
    const item = priceMeasuredOrderItem({
      productId: product.id,
      productName: product.name,
      measurementType: product.measurementType,
      actualQuantity: input.quantity,
      priceCents: price.priceCents,
      priceBasisQuantity: price.basisQuantity,
      priceBasisUnit: price.basisUnit,
    });

    const totalCents = item.finalAmountCents ?? item.estimatedAmountCents;

    const order = await tx.order.create({
      data: {
        businessId: input.context.businessId,
        branchId: input.branchId,
        fulfillmentType: "PICKUP",
        salesChannel: "POS",
        status: "COMPLETED",
        subtotalCents: totalCents,
        totalCents,
        completedAt: new Date(),
        createdByUserId: input.context.userId,

        items: {
          create: {
            businessId: input.context.businessId,
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            measurementTypeSnapshot: item.measurementTypeSnapshot,
            requestedQuantity: item.requestedQuantity,
            actualQuantity: item.actualQuantity,
            priceCentsSnapshot: item.priceCentsSnapshot,
            priceBasisQuantitySnapshot: item.priceBasisQuantitySnapshot,
            priceBasisUnitSnapshot: item.priceBasisUnitSnapshot,
            estimatedAmountCents: item.estimatedAmountCents,
            finalAmountCents: item.finalAmountCents,
          },
        },

        payments: {
          create: {
            businessId: input.context.businessId,
            branchId: input.branchId,
            cashSessionId: cashSession.id,
            actorUserId: input.context.userId,
            method: input.paymentMethod,
            amountCents: totalCents,
          },
        },

        statusHistory: {
          create: {
            businessId: input.context.businessId,
            actorUserId: input.context.userId,
            fromStatus: null,
            toStatus: "COMPLETED",
            reason: "Venda presencial finalizada no PDV",
          },
        },
      },
    });

    /*
     * O estoque sempre usa a quantidade física efetivamente vendida.
     *
     * PDV:
     * 527 g vendidos -> -527 g de estoque.
     */
    await createStockMovement({
      tx,
      businessId: input.context.businessId,
      branchId: input.branchId,
      productId: product.id,
      actorUserId: input.context.userId,
      type: "SALE",
      quantityDelta: -item.actualQuantity!,
      reason: "Venda presencial no PDV",
      sourceType: "Order",
      sourceId: order.id,
      idempotencyKeyId: key.id,
    });

    await writeAuditLog({
      tx,
      businessId: input.context.businessId,
      branchId: input.branchId,
      actorUserId: input.context.userId,
      action: "PAYMENT_RECORDED",
      entityType: "Order",
      entityId: order.id,
      after: {
        amountCents: totalCents,
        paymentMethod: input.paymentMethod,
        cashSessionId: cashSession.id,
      } satisfies Prisma.InputJsonValue,
    });

    const response = {
      orderId: order.id,
      totalCents,
      status: order.status,
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
