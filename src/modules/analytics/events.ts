import type { AnalyticsEventType, Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { logger } from "@/lib/logger";

export async function recordAnalyticsEvent(input: {
  businessId: string;
  branchId?: string | null;
  leadSourceId?: string | null;
  anonymousId: string;
  eventType: AnalyticsEventType;
  productId?: string | null;
  orderId?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        businessId: input.businessId,
        branchId: input.branchId,
        leadSourceId: input.leadSourceId,
        anonymousId: input.anonymousId,
        eventType: input.eventType,
        productId: input.productId,
        orderId: input.orderId,
        metadata: input.metadata
      }
    });
  } catch (error) {
    logger.warn("analytics_event_failed", {
      eventType: input.eventType,
      businessId: input.businessId,
      error: error instanceof Error ? error.message : "unknown"
    });
  }
}
