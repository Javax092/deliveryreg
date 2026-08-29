import { prisma } from "@/db/prisma";
import {
  averagePurchaseFrequencyDays,
  segmentCustomer,
  segmentLabels
} from "@/modules/crm/segmentation";

export async function listCustomers360(businessId: string) {
  const customers = await prisma.customer.findMany({
    where: {
      businessId
    },
    include: {
      orders: {
        where: {
          status: "COMPLETED"
        },
        include: {
          items: true
        },
        orderBy: {
          completedAt: "asc"
        }
      },
      leads: {
        include: {
          leadSource: true
        },
        orderBy: {
          createdAt: "asc"
        },
        take: 1
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  const now = new Date();

  return customers.map((customer) => {
    const completedOrders = customer.orders;
    const totalRevenueCents = completedOrders.reduce((total, order) => total + order.totalCents, 0);
    const lastPurchaseAt = completedOrders.at(-1)?.completedAt ?? null;
    const firstPurchaseAt = completedOrders[0]?.completedAt ?? null;
    const segment = segmentCustomer({
      completedOrderCount: completedOrders.length,
      lastPurchaseAt,
      now
    });

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      orderCount: completedOrders.length,
      totalRevenueCents,
      averageTicketCents:
        completedOrders.length > 0 ? Math.round(totalRevenueCents / completedOrders.length) : null,
      firstPurchaseAt,
      lastPurchaseAt,
      averageFrequencyDays: averagePurchaseFrequencyDays(
        completedOrders.flatMap((order) => (order.completedAt ? [order.completedAt] : []))
      ),
      segment,
      segmentLabel: segmentLabels[segment],
      sourceLabel: customer.leads[0]?.leadSource?.label ?? "dados insuficientes"
    };
  });
}

export async function getCustomer360(input: {
  businessId: string;
  customerId: string;
}) {
  const customers = await listCustomers360(input.businessId);
  const customer = customers.find((item) => item.id === input.customerId);

  if (!customer) {
    return null;
  }

  const orders = await prisma.order.findMany({
    where: {
      businessId: input.businessId,
      customerId: input.customerId
    },
    include: {
      branch: true,
      items: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const productTotals = new Map<string, { quantity: number; revenueCents: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const current = productTotals.get(item.productNameSnapshot) ?? {
        quantity: 0,
        revenueCents: 0
      };
      current.quantity += item.actualQuantity ?? item.requestedQuantity;
      current.revenueCents += item.finalAmountCents ?? item.estimatedAmountCents;
      productTotals.set(item.productNameSnapshot, current);
    }
  }

  const favoriteProducts = [...productTotals.entries()]
    .map(([name, totals]) => ({ name, ...totals }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  return {
    customer,
    orders,
    favoriteProducts
  };
}
