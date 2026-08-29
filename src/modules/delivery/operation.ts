import type { DeliveryStatus } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { writeAuditLog } from "@/modules/audit/audit";
import { assertBranchAccess } from "@/modules/business/tenant";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertPermission } from "@/modules/shared/auth/permissions";
import { AppError } from "@/modules/shared/errors/app-error";

const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  ASSIGNED: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["ON_ROUTE", "FAILED"],
  ON_ROUTE: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: []
};

export async function listAssignableDeliveryUsers(context: AuthContext) {
  assertPermission(context, "delivery:manage");

  return prisma.user.findMany({
    where: {
      businessId: context.businessId,
      role: "DELIVERY",
      isActive: true
    },
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
}

export async function assignDelivery(input: {
  context: AuthContext;
  deliveryId: string;
  deliveryUserId: string;
}) {
  assertPermission(input.context, "delivery:manage");

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findFirst({
      where: {
        id: input.deliveryId,
        businessId: input.context.businessId
      }
    });

    if (!delivery) {
      throw new AppError("NOT_FOUND");
    }

    assertBranchAccess(input.context, {
      businessId: delivery.businessId,
      branchId: delivery.branchId
    });

    if (delivery.status !== "ASSIGNED") {
      throw new AppError("INVALID_STATE_TRANSITION");
    }

    const user = await tx.user.findFirst({
      where: {
        id: input.deliveryUserId,
        businessId: input.context.businessId,
        role: "DELIVERY",
        isActive: true,
        branchAccesses: {
          some: {
            branchId: delivery.branchId
          }
        }
      }
    });

    if (!user) {
      throw new AppError("AUTHORIZATION_ERROR");
    }

    const updated = await tx.delivery.update({
      where: {
        id: delivery.id
      },
      data: {
        assignedUserId: user.id,
        assignedAt: new Date()
      }
    });

    await writeAuditLog({
      tx,
      businessId: delivery.businessId,
      branchId: delivery.branchId,
      actorUserId: input.context.userId,
      action: delivery.assignedUserId ? "DELIVERY_REASSIGNED" : "DELIVERY_ASSIGNED",
      entityType: "Delivery",
      entityId: delivery.id,
      before: {
        assignedUserId: delivery.assignedUserId
      },
      after: {
        assignedUserId: updated.assignedUserId
      }
    });

    return updated;
  });
}

export async function transitionAssignedDelivery(input: {
  context: AuthContext;
  deliveryId: string;
  toStatus: DeliveryStatus;
  failureReason?: string;
}) {
  assertPermission(input.context, "delivery:assigned:read");

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: input.deliveryId,
      businessId: input.context.businessId,
      assignedUserId: input.context.userId
    }
  });

  if (!delivery) {
    throw new AppError("NOT_FOUND");
  }

  if (!transitions[delivery.status].includes(input.toStatus)) {
    throw new AppError("INVALID_STATE_TRANSITION");
  }

  return prisma.delivery.update({
    where: {
      id: delivery.id
    },
    data: {
      status: input.toStatus,
      pickedUpAt: input.toStatus === "PICKED_UP" ? new Date() : delivery.pickedUpAt,
      onRouteAt: input.toStatus === "ON_ROUTE" ? new Date() : delivery.onRouteAt,
      deliveredAt: input.toStatus === "DELIVERED" ? new Date() : delivery.deliveredAt,
      failedAt: input.toStatus === "FAILED" ? new Date() : delivery.failedAt,
      failureReason: input.toStatus === "FAILED" ? input.failureReason : delivery.failureReason
    }
  });
}
