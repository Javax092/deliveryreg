import { Prisma, type MeasurementType, type OrderStatus, type PaymentMethod } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { segmentCustomer, segmentLabels, type CustomerSegment } from "@/modules/crm/segmentation";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertPermission } from "@/modules/shared/auth/permissions";
import { BUSINESS_TIMEZONE, businessDateKey } from "@/modules/shared/time/timezone";

export type ManagementPeriodPreset = "today" | "yesterday" | "7d" | "30d" | "custom";

export type ManagementPeriod = {
  preset: ManagementPeriodPreset;
  label: string;
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  dayKeys: string[];
};

export type Trend = {
  currentCents: number;
  previousCents: number;
  percent: number | null;
  label: string;
};

export type ManagementDashboard = {
  period: ManagementPeriod;
  scope: {
    selectedBranchId: string | null;
    availableBranches: Array<{ id: string; name: string }>;
    canSelectAllBranches: boolean;
  };
  sales: {
    recognizedRevenueCents: number;
    completedOrders: number;
    averageTicketCents: number | null;
    cancelledOrders: number;
    cancellationRatePercent: number | null;
    inProgressOrders: number;
    deliveryInProgress: number;
    trend: Trend;
  };
  operationNow: Array<{ status: OrderStatus | "DELIVERY_IN_PROGRESS"; label: string; count: number; href: string }>;
  salesEvolution: Array<{ dateKey: string; label: string; revenueCents: number; orderCount: number }>;
  products: Array<{
    productId: string;
    name: string;
    measurementType: MeasurementType;
    quantity: number;
    quantityLabel: string;
    revenueCents: number;
  }>;
  payments: Array<{ method: PaymentMethod; label: string; amountCents: number; count: number }>;
  branches: Array<{ branchId: string; name: string; completedOrders: number; revenueCents: number }>;
  channels: Array<{ channel: "DIGITAL" | "POS"; label: string; completedOrders: number; revenueCents: number }>;
  customers: {
    purchasedInPeriod: number;
    newInPeriod: number;
    recurringInPeriod: number;
    segments: Array<{ segment: CustomerSegment; label: string; count: number }>;
  };
  inventoryAttention: Array<{ productId: string; productName: string; branchName: string; balance: number; quantityLabel: string }>;
  periodSummary: {
    recognizedRevenueCents: number;
    registeredPaymentsCents: number;
    observedDifferenceCents: number;
  };
};

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  DEBIT_CARD: "Debito",
  CREDIT_CARD: "Credito"
};

const channelLabels: Record<"DIGITAL" | "POS", string> = {
  DIGITAL: "Cardapio/QR",
  POS: "PDV"
};

const operationLabels: Record<OrderStatus | "DELIVERY_IN_PROGRESS", string> = {
  CREATED: "Pedidos novos",
  ACCEPTED: "Pedidos aceitos",
  PREPARING: "Em preparo",
  READY: "Prontos",
  COMPLETED: "Concluidos",
  CANCELLED: "Cancelados",
  DELIVERY_IN_PROGRESS: "Deliveries em andamento"
};

const operationalStatuses: OrderStatus[] = ["CREATED", "ACCEPTED", "PREPARING", "READY"];

export function calculateAverageTicketCents(input: {
  revenueCents: number;
  completedOrders: number;
}): number | null {
  if (input.completedOrders <= 0) {
    return null;
  }

  return Math.round(input.revenueCents / input.completedOrders);
}

export function calculateTrend(input: { currentCents: number; previousCents: number }): Trend {
  if (input.previousCents <= 0) {
    return {
      currentCents: input.currentCents,
      previousCents: input.previousCents,
      percent: null,
      label: "Sem base anterior"
    };
  }

  const percent = ((input.currentCents - input.previousCents) / input.previousCents) * 100;

  return {
    currentCents: input.currentCents,
    previousCents: input.previousCents,
    percent,
    label: `${percent >= 0 ? "+" : ""}${percent.toFixed(1).replace(".", ",")}% vs periodo anterior`
  };
}

export function formatSoldQuantity(input: {
  measurementType: MeasurementType;
  quantity: number;
}): string {
  if (input.measurementType === "WEIGHT") {
    return `${formatDecimal(input.quantity / 1000, 3)} kg`;
  }

  if (input.measurementType === "VOLUME") {
    return `${formatDecimal(input.quantity / 1000, 3)} l`;
  }

  if (input.measurementType === "PACKAGE") {
    return `${formatDecimal(input.quantity, 0)} pac.`;
  }

  if (input.measurementType === "BOX") {
    return `${formatDecimal(input.quantity, 0)} cx.`;
  }

  return `${formatDecimal(input.quantity, 0)} un.`;
}

export function resolveManagementPeriod(input: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
}): ManagementPeriod {
  const now = input.now ?? new Date();
  const todayKey = businessDateKey(now);
  const preset = parsePreset(input.preset);

  if (preset === "custom" && input.from && input.to) {
    const fromParts = parseDateKey(input.from);
    const toParts = parseDateKey(input.to);
    const from = zonedDateTimeToUtc(fromParts.year, fromParts.month, fromParts.day, 0, 0, 0, 0);
    const to = addDays(zonedDateTimeToUtc(toParts.year, toParts.month, toParts.day, 0, 0, 0, 0), 1);
    return buildPeriod("custom", `${input.from} a ${input.to}`, from, to);
  }

  if (preset === "yesterday") {
    const todayStart = startOfBusinessDay(todayKey);
    return buildPeriod("yesterday", "Ontem", addDays(todayStart, -1), todayStart);
  }

  if (preset === "7d") {
    const tomorrowStart = addDays(startOfBusinessDay(todayKey), 1);
    return buildPeriod("7d", "Ultimos 7 dias", addDays(tomorrowStart, -7), tomorrowStart);
  }

  if (preset === "30d") {
    const tomorrowStart = addDays(startOfBusinessDay(todayKey), 1);
    return buildPeriod("30d", "Ultimos 30 dias", addDays(tomorrowStart, -30), tomorrowStart);
  }

  const todayStart = startOfBusinessDay(todayKey);
  return buildPeriod("today", "Hoje", todayStart, addDays(todayStart, 1));
}

export async function getManagementDashboard(input: {
  context: AuthContext;
  period: ManagementPeriod;
  branchId?: string | null;
}): Promise<ManagementDashboard> {
  assertPermission(input.context, "audit:read");

  const branchScope = await resolveBranchScope(input.context, input.branchId ?? null);
  const branchIds = branchScope.selectedBranchId ? [branchScope.selectedBranchId] : branchScope.allowedBranchIds;

  if (branchIds.length === 0) {
    const emptyTrend = calculateTrend({ currentCents: 0, previousCents: 0 });

    return {
      period: input.period,
      scope: {
        selectedBranchId: null,
        availableBranches: [],
        canSelectAllBranches: false
      },
      sales: {
        recognizedRevenueCents: 0,
        completedOrders: 0,
        averageTicketCents: null,
        cancelledOrders: 0,
        cancellationRatePercent: null,
        inProgressOrders: 0,
        deliveryInProgress: 0,
        trend: emptyTrend
      },
      operationNow: operationalStatuses.map((status) => ({
        status,
        label: operationLabels[status],
        count: 0,
        href: "/operacao"
      })),
      salesEvolution: input.period.dayKeys.map((dateKey) => ({
        dateKey,
        label: dateKey.slice(5).split("-").reverse().join("/"),
        revenueCents: 0,
        orderCount: 0
      })),
      products: [],
      payments: [],
      branches: [],
      channels: [],
      customers: {
        purchasedInPeriod: 0,
        newInPeriod: 0,
        recurringInPeriod: 0,
        segments: Object.entries(segmentLabels).map(([segment, label]) => ({
          segment: segment as CustomerSegment,
          label,
          count: 0
        }))
      },
      inventoryAttention: [],
      periodSummary: {
        recognizedRevenueCents: 0,
        registeredPaymentsCents: 0,
        observedDifferenceCents: 0
      }
    };
  }

  const [
    currentSales,
    previousSales,
    cancelledOrders,
    statusCounts,
    deliveryInProgress,
    salesEvolution,
    products,
    payments,
    branches,
    channels,
    customers,
    inventoryAttention
  ] = await Promise.all([
    aggregateCompletedSales(input.context.businessId, branchIds, input.period.from, input.period.to),
    aggregateCompletedSales(input.context.businessId, branchIds, input.period.previousFrom, input.period.previousTo),
    countCancelledOrders(input.context.businessId, branchIds, input.period.from, input.period.to),
    countOrdersByStatus(input.context.businessId, branchIds),
    countDeliveryInProgress(input.context.businessId, branchIds),
    getSalesEvolution(input.context.businessId, branchIds, input.period),
    getTopProducts(input.context.businessId, branchIds, input.period.from, input.period.to),
    getPaymentBreakdown(input.context.businessId, branchIds, input.period.from, input.period.to),
    getBranchBreakdown(input.context.businessId, branchIds, input.period.from, input.period.to),
    getChannelBreakdown(input.context.businessId, branchIds, input.period.from, input.period.to),
    getCustomerSummary(input.context.businessId, branchIds, input.period.from, input.period.to),
    getInventoryAttention(input.context.businessId, branchIds)
  ]);

  const inProgressOrders = operationalStatuses.reduce(
    (total, status) => total + (statusCounts.get(status) ?? 0),
    0
  );
  const registeredPaymentsCents = payments.reduce((total, payment) => total + payment.amountCents, 0);
  const completedAndCancelled = currentSales.completedOrders + cancelledOrders;

  return {
    period: input.period,
    scope: {
      selectedBranchId: branchScope.selectedBranchId,
      availableBranches: branchScope.availableBranches,
      canSelectAllBranches: branchScope.availableBranches.length > 1
    },
    sales: {
      recognizedRevenueCents: currentSales.revenueCents,
      completedOrders: currentSales.completedOrders,
      averageTicketCents: calculateAverageTicketCents({
        revenueCents: currentSales.revenueCents,
        completedOrders: currentSales.completedOrders
      }),
      cancelledOrders,
      cancellationRatePercent:
        completedAndCancelled > 0 ? (cancelledOrders / completedAndCancelled) * 100 : null,
      inProgressOrders,
      deliveryInProgress,
      trend: calculateTrend({
        currentCents: currentSales.revenueCents,
        previousCents: previousSales.revenueCents
      })
    },
    operationNow: [
      ...operationalStatuses.map((status) => ({
        status,
        label: operationLabels[status],
        count: statusCounts.get(status) ?? 0,
        href: "/operacao"
      })),
      {
        status: "DELIVERY_IN_PROGRESS" as const,
        label: operationLabels.DELIVERY_IN_PROGRESS,
        count: deliveryInProgress,
        href: "/entregas"
      }
    ],
    salesEvolution,
    products,
    payments,
    branches,
    channels,
    customers,
    inventoryAttention,
    periodSummary: {
      recognizedRevenueCents: currentSales.revenueCents,
      registeredPaymentsCents,
      observedDifferenceCents: currentSales.revenueCents - registeredPaymentsCents
    }
  };
}

async function resolveBranchScope(context: AuthContext, requestedBranchId: string | null) {
  const allBranches = await prisma.branch.findMany({
    where: {
      businessId: context.businessId,
      isActive: true,
      ...(context.branchIds.length > 0 ? { id: { in: context.branchIds } } : {})
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: "asc"
    }
  });
  const allowedBranchIds = allBranches.map((branch) => branch.id);

  if (requestedBranchId && !allowedBranchIds.includes(requestedBranchId)) {
    return {
      selectedBranchId: null,
      allowedBranchIds,
      availableBranches: allBranches
    };
  }

  return {
    selectedBranchId: requestedBranchId,
    allowedBranchIds,
    availableBranches: allBranches
  };
}

async function aggregateCompletedSales(
  businessId: string,
  branchIds: string[],
  from: Date,
  to: Date
) {
  const result = await prisma.order.aggregate({
    where: {
      businessId,
      branchId: { in: branchIds },
      status: "COMPLETED",
      completedAt: {
        gte: from,
        lt: to
      }
    },
    _sum: {
      totalCents: true
    },
    _count: {
      _all: true
    }
  });

  return {
    revenueCents: result._sum.totalCents ?? 0,
    completedOrders: result._count._all
  };
}

async function countCancelledOrders(businessId: string, branchIds: string[], from: Date, to: Date) {
  return prisma.order.count({
    where: {
      businessId,
      branchId: { in: branchIds },
      status: "CANCELLED",
      cancelledAt: {
        gte: from,
        lt: to
      }
    }
  });
}

async function countOrdersByStatus(businessId: string, branchIds: string[]) {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    where: {
      businessId,
      branchId: { in: branchIds },
      status: { in: operationalStatuses }
    },
    _count: {
      _all: true
    }
  });

  return new Map(rows.map((row) => [row.status, row._count._all]));
}

async function countDeliveryInProgress(businessId: string, branchIds: string[]) {
  return prisma.delivery.count({
    where: {
      businessId,
      branchId: { in: branchIds },
      status: {
        in: ["ASSIGNED", "PICKED_UP", "ON_ROUTE"]
      }
    }
  });
}

async function getSalesEvolution(businessId: string, branchIds: string[], period: ManagementPeriod) {
  const rows = await prisma.order.groupBy({
    by: ["completedAt"],
    where: {
      businessId,
      branchId: { in: branchIds },
      status: "COMPLETED",
      completedAt: {
        gte: period.from,
        lt: period.to
      }
    },
    _sum: {
      totalCents: true
    },
    _count: {
      _all: true
    }
  });
  const byDay = new Map<string, { revenueCents: number; orderCount: number }>();

  for (const row of rows) {
    if (!row.completedAt) {
      continue;
    }

    const key = businessDateKey(row.completedAt);
    const current = byDay.get(key) ?? { revenueCents: 0, orderCount: 0 };
    current.revenueCents += row._sum.totalCents ?? 0;
    current.orderCount += row._count._all;
    byDay.set(key, current);
  }

  return period.dayKeys.map((dateKey) => ({
    dateKey,
    label: dateKey.slice(5).split("-").reverse().join("/"),
    revenueCents: byDay.get(dateKey)?.revenueCents ?? 0,
    orderCount: byDay.get(dateKey)?.orderCount ?? 0
  }));
}

async function getTopProducts(businessId: string, branchIds: string[], from: Date, to: Date) {
  const rows = await prisma.$queryRaw<
    Array<{
      product_id: string;
      product_name: string;
      measurement_type: MeasurementType;
      quantity: bigint;
      revenue_cents: bigint;
    }>
  >`
    select
      oi."productId" as product_id,
      oi."productNameSnapshot" as product_name,
      oi."measurementTypeSnapshot" as measurement_type,
      sum(coalesce(oi."actualQuantity", oi."requestedQuantity")) as quantity,
      sum(coalesce(oi."finalAmountCents", oi."estimatedAmountCents")) as revenue_cents
    from "OrderItem" oi
    inner join "Order" o on o.id = oi."orderId"
    where o."businessId" = ${businessId}
      and oi."businessId" = ${businessId}
      and o."branchId" in (${Prisma.join(branchIds)})
      and o.status = 'COMPLETED'
      and o."completedAt" >= ${from}
      and o."completedAt" < ${to}
    group by oi."productId", oi."productNameSnapshot", oi."measurementTypeSnapshot"
    order by revenue_cents desc, quantity desc
    limit 10
  `;

  return rows.map((row) => ({
    productId: row.product_id,
    name: row.product_name,
    measurementType: row.measurement_type,
    quantity: Number(row.quantity),
    quantityLabel: formatSoldQuantity({
      measurementType: row.measurement_type,
      quantity: Number(row.quantity)
    }),
    revenueCents: Number(row.revenue_cents)
  }));
}

async function getPaymentBreakdown(businessId: string, branchIds: string[], from: Date, to: Date) {
  const rows = await prisma.payment.groupBy({
    by: ["method"],
    where: {
      businessId,
      branchId: { in: branchIds },
      createdAt: {
        gte: from,
        lt: to
      }
    },
    _sum: {
      amountCents: true
    },
    _count: {
      _all: true
    }
  });

  return rows
    .map((row) => ({
      method: row.method,
      label: paymentLabels[row.method],
      amountCents: row._sum.amountCents ?? 0,
      count: row._count._all
    }))
    .sort((a, b) => b.amountCents - a.amountCents);
}

async function getBranchBreakdown(businessId: string, branchIds: string[], from: Date, to: Date) {
  const rows = await prisma.order.groupBy({
    by: ["branchId"],
    where: {
      businessId,
      branchId: { in: branchIds },
      status: "COMPLETED",
      completedAt: {
        gte: from,
        lt: to
      }
    },
    _sum: {
      totalCents: true
    },
    _count: {
      _all: true
    }
  });
  const names = await prisma.branch.findMany({
    where: {
      businessId,
      id: { in: branchIds }
    },
    select: {
      id: true,
      name: true
    }
  });
  const nameById = new Map(names.map((branch) => [branch.id, branch.name]));

  return rows
    .map((row) => ({
      branchId: row.branchId,
      name: nameById.get(row.branchId) ?? "Unidade",
      completedOrders: row._count._all,
      revenueCents: row._sum.totalCents ?? 0
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

async function getChannelBreakdown(businessId: string, branchIds: string[], from: Date, to: Date) {
  const rows = await prisma.order.groupBy({
    by: ["salesChannel"],
    where: {
      businessId,
      branchId: { in: branchIds },
      status: "COMPLETED",
      completedAt: {
        gte: from,
        lt: to
      }
    },
    _sum: {
      totalCents: true
    },
    _count: {
      _all: true
    }
  });

  return rows
    .map((row) => ({
      channel: row.salesChannel,
      label: channelLabels[row.salesChannel],
      completedOrders: row._count._all,
      revenueCents: row._sum.totalCents ?? 0
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

async function getCustomerSummary(businessId: string, branchIds: string[], from: Date, to: Date) {
  const periodCustomers = await prisma.order.findMany({
    where: {
      businessId,
      branchId: { in: branchIds },
      status: "COMPLETED",
      completedAt: {
        gte: from,
        lt: to
      },
      customerId: {
        not: null
      }
    },
    distinct: ["customerId"],
    select: {
      customerId: true
    }
  });
  const customerIds = periodCustomers.flatMap((order) => (order.customerId ? [order.customerId] : []));
  const previousPurchases = customerIds.length
    ? await prisma.order.groupBy({
        by: ["customerId"],
        where: {
          businessId,
          branchId: { in: branchIds },
          status: "COMPLETED",
          customerId: { in: customerIds },
          completedAt: {
            lt: from
          }
        },
        _count: {
          _all: true
        }
      })
    : [];
  const recurringCustomerIds = new Set(previousPurchases.map((row) => row.customerId));
  const allCustomers = await prisma.customer.findMany({
    where: {
      businessId,
      orders: {
        some: {
          businessId,
          branchId: { in: branchIds },
          status: "COMPLETED"
        }
      }
    },
    select: {
      id: true,
      orders: {
        where: {
          businessId,
          branchId: { in: branchIds },
          status: "COMPLETED"
        },
        select: {
          completedAt: true
        },
        orderBy: {
          completedAt: "asc"
        }
      }
    }
  });
  const segments = new Map<CustomerSegment, number>(
    Object.keys(segmentLabels).map((segment) => [segment as CustomerSegment, 0])
  );
  const now = new Date();

  for (const customer of allCustomers) {
    const completedDates = customer.orders.flatMap((order) => (order.completedAt ? [order.completedAt] : []));
    const segment = segmentCustomer({
      completedOrderCount: completedDates.length,
      lastPurchaseAt: completedDates.at(-1) ?? null,
      now
    });
    segments.set(segment, (segments.get(segment) ?? 0) + 1);
  }

  return {
    purchasedInPeriod: customerIds.length,
    newInPeriod: customerIds.filter((customerId) => !recurringCustomerIds.has(customerId)).length,
    recurringInPeriod: customerIds.filter((customerId) => recurringCustomerIds.has(customerId)).length,
    segments: [...segments.entries()].map(([segment, count]) => ({
      segment,
      label: segmentLabels[segment],
      count
    }))
  };
}

async function getInventoryAttention(businessId: string, branchIds: string[]) {
  const rows = await prisma.$queryRaw<
    Array<{
      product_id: string;
      product_name: string;
      measurement_type: MeasurementType;
      branch_name: string;
      balance: bigint;
    }>
  >`
    select
      p.id as product_id,
      p.name as product_name,
      p."measurementType" as measurement_type,
      b.name as branch_name,
      coalesce(sum(sm."quantityDelta"), 0) as balance
    from "Product" p
    inner join "ProductBranchAvailability" pba on pba."productId" = p.id
    inner join "Branch" b on b.id = pba."branchId"
    left join "StockMovement" sm
      on sm."productId" = p.id
      and sm."branchId" = pba."branchId"
      and sm."businessId" = ${businessId}
    where p."businessId" = ${businessId}
      and pba."businessId" = ${businessId}
      and pba."branchId" in (${Prisma.join(branchIds)})
      and p."isActive" = true
      and pba."isAvailable" = true
    group by p.id, p.name, p."measurementType", b.name
    having coalesce(sum(sm."quantityDelta"), 0) <= 0
    order by balance asc, p.name asc
    limit 5
  `;

  return rows.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    branchName: row.branch_name,
    balance: Number(row.balance),
    quantityLabel: formatSoldQuantity({
      measurementType: row.measurement_type,
      quantity: Number(row.balance)
    })
  }));
}

function parsePreset(value?: string | null): ManagementPeriodPreset {
  if (value === "yesterday" || value === "7d" || value === "30d" || value === "custom") {
    return value;
  }

  return "today";
}

function buildPeriod(preset: ManagementPeriodPreset, label: string, from: Date, to: Date): ManagementPeriod {
  const duration = to.getTime() - from.getTime();

  return {
    preset,
    label,
    from,
    to,
    previousFrom: new Date(from.getTime() - duration),
    previousTo: from,
    dayKeys: enumerateBusinessDays(from, to)
  };
}

function enumerateBusinessDays(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let cursor = startOfBusinessDay(businessDateKey(from));

  while (cursor < to) {
    keys.push(businessDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return keys;
}

function startOfBusinessDay(dateKey: string): Date {
  const parts = parseDateKey(dateKey);
  return zonedDateTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, 0);
}

function parseDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Invalid date key.");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess));
  return new Date(utcGuess - offset);
}

function getTimeZoneOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatDecimal(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits
  }).format(value);
}
