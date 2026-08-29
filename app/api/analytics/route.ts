import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { recordAnalyticsEvent } from "@/modules/analytics/events";
import { resolveLeadSource } from "@/modules/leads/source";
import { getDefaultPublicBusiness } from "@/modules/public-catalog/queries";

const analyticsInputSchema = z.object({
  eventType: z.enum([
    "catalog_viewed",
    "product_viewed",
    "product_added",
    "cart_viewed",
    "checkout_started",
    "lead_created",
    "order_created",
    "order_completed"
  ]),
  sourceCode: z.string().max(100).optional(),
  productId: z.string().max(120).optional(),
  orderId: z.string().max(120).optional()
});

export async function POST(request: NextRequest) {
  const anonymousId = request.cookies.get("deliveryreg_anon")?.value ?? randomUUID();
  const response = NextResponse.json({ ok: true });
  response.cookies.set("deliveryreg_anon", anonymousId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365
  });

  try {
    const payload = analyticsInputSchema.parse(await request.json());
    const business = await getDefaultPublicBusiness();

    if (!business) {
      return response;
    }

    const source = await resolveLeadSource({
      businessId: business.id,
      sourceCode: payload.sourceCode
    });

    await recordAnalyticsEvent({
      businessId: business.id,
      branchId: source?.branchId,
      leadSourceId: source?.id,
      anonymousId,
      eventType: payload.eventType,
      productId: payload.productId,
      orderId: payload.orderId
    });
  } catch {
    return response;
  }

  return response;
}
