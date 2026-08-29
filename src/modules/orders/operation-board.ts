import { prisma } from "@/db/prisma";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertPermission } from "@/modules/shared/auth/permissions";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";

export const operationalStatuses = [
  "CREATED",
  "ACCEPTED",
  "PREPARING",
  "READY",
] as const;

export type OperationalStatus = (typeof operationalStatuses)[number];

export const operationalColumns: Array<{
  status: OperationalStatus;
  title: string;
  action: string;
}> = [
  { status: "CREATED", title: "Novos", action: "Aceitar" },
  { status: "ACCEPTED", title: "Aceitos", action: "Preparar" },
  { status: "PREPARING", title: "Em preparo", action: "Marcar pronto" },
  { status: "READY", title: "Prontos", action: "Finalizar" },
];

export async function listOperationalOrders(context: AuthContext) {
  assertPermission(context, "orders:read");

  const orders = await prisma.order.findMany({
    where: {
      businessId: context.businessId,
      ...(context.role === "ATTENDANT" || context.role === "DELIVERY"
        ? {
            branchId: {
              in: context.branchIds,
            },
          }
        : {}),
      status: {
        in: [...operationalStatuses],
      },
    },
    select: {
      id: true,
      status: true,
      fulfillmentType: true,
      subtotalCents: true,
      totalCents: true,
      createdAt: true,
      branch: {
        select: {
          name: true,
        },
      },
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      leadSource: {
        select: {
          label: true,
          code: true,
        },
      },
      items: {
        select: {
          id: true,
          productNameSnapshot: true,
          requestedQuantity: true,
          actualQuantity: true,
          measurementTypeSnapshot: true,
          estimatedAmountCents: true,
          finalAmountCents: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      delivery: {
        select: {
          id: true,
          status: true,
          feeCents: true,
          assignedUserId: true,
          address: {
            select: {
              street: true,
              number: true,
              neighborhood: true,
              reference: true,
            },
          },
        },
      },
      statusHistory: {
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          reason: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      payments: {
        select: {
          method: true,
          amountCents: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const now = new Date();

  return orders.map((order) => {
    const waitingMinutes = Math.max(
      0,
      Math.floor((now.getTime() - order.createdAt.getTime()) / 60000),
    );

    return {
      ...order,
      status: order.status as OperationalStatus,
      createdAtLabel: formatBusinessDateTime(order.createdAt),
      waitingLabel: formatWaitingTime(order.createdAt, now),
      waitingMinutes,
      urgency: resolveOrderUrgency(waitingMinutes),
      hasPendingWeight: order.items.some(
        (item) =>
          item.measurementTypeSnapshot === "WEIGHT" &&
          item.actualQuantity === null,
      ),
    };
  });
}

function formatWaitingTime(createdAt: Date, now: Date): string {
  const minutes = Math.max(
    0,
    Math.floor((now.getTime() - createdAt.getTime()) / 60000),
  );

  if (minutes < 1) {
    return "agora";
  }

  if (minutes < 60) {
    return `há ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `há ${hours} h`;
  }

  return `há ${hours} h ${remainingMinutes} min`;
}
function resolveOrderUrgency(
  waitingMinutes: number,
): "normal" | "attention" | "critical" {
  if (waitingMinutes >= 30) {
    return "critical";
  }

  if (waitingMinutes >= 15) {
    return "attention";
  }

  return "normal";
}
