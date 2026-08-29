import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { recordAnalyticsEvent } from "@/modules/analytics/events";
import { assertDeliveryMinimum, normalizeDeliveryZoneName } from "@/modules/delivery/rules";
import { priceOrderItem } from "@/modules/orders/pricing";
import { normalizeBrazilianPhone } from "@/modules/leads/phone";
import { AppError } from "@/modules/shared/errors/app-error";
import { hashRequestPayload, lockIdempotencyOperation } from "@/modules/shared/idempotency";

export type PickupOrderCartItem = {
  productId: string;
  requestedQuantity: number;
};

export async function createPickupOrder(input: {
  businessId: string;
  branchId: string;
  leadSourceId?: string | null;
  anonymousId: string;
  idempotencyKey: string;
  fulfillmentType?: "PICKUP" | "DELIVERY";
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    reference?: string | null;
  };
  customer: {
    name: string;
    whatsapp: string;
  };
  items: PickupOrderCartItem[];
}) {
  if (input.items.length === 0) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Order must contain at least one item."
    });
  }

  const normalizedPhone = normalizeBrazilianPhone(input.customer.whatsapp);
  const customerName = input.customer.name.trim();

  if (customerName.length < 2) {
    throw new AppError("VALIDATION_ERROR");
  }

  const requestHash = hashRequestPayload({
    branchId: input.branchId,
    fulfillmentType: input.fulfillmentType ?? "PICKUP",
    address: input.address,
    customerName,
    normalizedPhone,
    items: input.items
  });

  const result = await prisma.$transaction(async (tx) => {
    await lockIdempotencyOperation({
      tx,
      businessId: input.businessId,
      operation: "create-pickup-order",
      key: input.idempotencyKey
    });

    const existingKey = await tx.idempotencyKey.findUnique({
      where: {
        businessId_operation_key: {
          businessId: input.businessId,
          operation: "create-pickup-order",
          key: input.idempotencyKey
        }
      }
    });

    if (existingKey?.responseJson) {
      return existingKey.responseJson;
    }

    if (existingKey && existingKey.requestHash !== requestHash) {
      throw new AppError("CONFLICT", {
        message: "Idempotency key reused with different pickup order payload."
      });
    }

    const key =
      existingKey ??
      (await tx.idempotencyKey.create({
        data: {
          businessId: input.businessId,
          operation: "create-pickup-order",
          key: input.idempotencyKey,
          requestHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }));

    const branch = await tx.branch.findFirst({
      where: {
        id: input.branchId,
        businessId: input.businessId,
        isActive: true
      }
    });

    if (!branch) {
      throw new AppError("NOT_FOUND", {
        message: "Branch not available for pickup."
      });
    }

    const customer = await tx.customer.upsert({
      where: {
        businessId_normalizedPhone: {
          businessId: input.businessId,
          normalizedPhone
        }
      },
      update: {
        name: customerName,
        phone: input.customer.whatsapp.trim()
      },
      create: {
        businessId: input.businessId,
        name: customerName,
        phone: input.customer.whatsapp.trim(),
        normalizedPhone
      }
    });

    const lead = await tx.lead.upsert({
      where: {
        businessId_normalizedPhone: {
          businessId: input.businessId,
          normalizedPhone
        }
      },
      update: {
        name: customerName,
        whatsapp: input.customer.whatsapp.trim(),
        branchId: input.branchId,
        leadSourceId: input.leadSourceId,
        customerId: customer.id,
        lastSeenAt: new Date()
      },
      create: {
        businessId: input.businessId,
        branchId: input.branchId,
        leadSourceId: input.leadSourceId,
        customerId: customer.id,
        name: customerName,
        whatsapp: input.customer.whatsapp.trim(),
        normalizedPhone
      }
    });

    const pricedItems = await Promise.all(
      input.items.map(async (item) => priceCartItem(tx, input.businessId, input.branchId, item))
    );
    const subtotalCents = pricedItems.reduce((total, item) => total + item.estimatedAmountCents, 0);
    let deliveryFeeCents = 0;
    let addressId: string | null = null;

    if (input.fulfillmentType === "DELIVERY") {
      if (!input.address) {
        throw new AppError("VALIDATION_ERROR");
      }

      const zone = await tx.deliveryZone.findFirst({
        where: {
          businessId: input.businessId,
          branchId: input.branchId,
          normalizedName: normalizeDeliveryZoneName(input.address.neighborhood),
          isActive: true
        }
      });

      if (!zone) {
        throw new AppError("NOT_FOUND", {
          message: "Delivery zone not available."
        });
      }

      assertDeliveryMinimum({
        subtotalCents,
        minimumOrderCents: zone.minimumOrderCents
      });
      deliveryFeeCents = zone.feeCents;

      const address = await tx.address.create({
        data: {
          businessId: input.businessId,
          customerId: customer.id,
          street: input.address.street.trim(),
          number: input.address.number.trim(),
          neighborhood: input.address.neighborhood.trim(),
          reference: input.address.reference?.trim()
        }
      });
      addressId = address.id;
    }

    const order = await tx.order.create({
      data: {
        businessId: input.businessId,
        branchId: input.branchId,
        leadId: lead.id,
        leadSourceId: input.leadSourceId,
        customerId: customer.id,
        fulfillmentType: input.fulfillmentType ?? "PICKUP",
        status: "CREATED",
        subtotalCents,
        totalCents: subtotalCents + deliveryFeeCents,
        items: {
          create: pricedItems.map((item) => ({
            businessId: input.businessId,
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            measurementTypeSnapshot: item.measurementTypeSnapshot,
            requestedQuantity: item.requestedQuantity,
            actualQuantity: item.actualQuantity,
            priceCentsSnapshot: item.priceCentsSnapshot,
            priceBasisQuantitySnapshot: item.priceBasisQuantitySnapshot,
            priceBasisUnitSnapshot: item.priceBasisUnitSnapshot,
            estimatedAmountCents: item.estimatedAmountCents,
            finalAmountCents: item.finalAmountCents
          }))
        }
      }
    });

    if (input.fulfillmentType === "DELIVERY" && addressId) {
      await tx.delivery.create({
        data: {
          businessId: input.businessId,
          branchId: input.branchId,
          orderId: order.id,
          addressId,
          feeCents: deliveryFeeCents
        }
      });
    }

    const response = {
      orderId: order.id,
      totalCents: order.totalCents,
      status: order.status
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

  await recordAnalyticsEvent({
    businessId: input.businessId,
    branchId: input.branchId,
    leadSourceId: input.leadSourceId,
    anonymousId: input.anonymousId,
    eventType: "order_created",
    orderId: typeof result === "object" && result && "orderId" in result ? String(result.orderId) : null
  });

  return result;
}

async function priceCartItem(
  tx: Prisma.TransactionClient,
  businessId: string,
  branchId: string,
  item: PickupOrderCartItem
) {
  const product = await tx.product.findFirst({
    where: {
      id: item.productId,
      businessId,
      isActive: true,
      availability: {
        some: {
          branchId,
          isAvailable: true
        }
      }
    },
    include: {
      prices: {
        where: {
          endsAt: null
        },
        orderBy: {
          startsAt: "desc"
        },
        take: 1
      }
    }
  });

  const price = product?.prices[0];

  if (!product || !price) {
    throw new AppError("NOT_FOUND", {
      message: "Product is not available for this branch."
    });
  }

  return priceOrderItem({
    productId: product.id,
    productName: product.name,
    measurementType: product.measurementType,
    requestedQuantity: item.requestedQuantity,
    sellingIncrement: product.sellingIncrement,
    minimumOrderQuantity: product.minimumOrderQuantity,
    priceCents: price.priceCents,
    priceBasisQuantity: price.basisQuantity,
    priceBasisUnit: price.basisUnit
  });
}
