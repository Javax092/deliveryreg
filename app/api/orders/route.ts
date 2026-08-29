import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { resolveLeadSource } from "@/modules/leads/source";
import { createPickupOrder } from "@/modules/orders/create-pickup-order";
import { getDefaultPublicBusiness } from "@/modules/public-catalog/queries";
import { AppError } from "@/modules/shared/errors/app-error";

const orderInputSchema = z.object({
  branchId: z.string().min(1),
  sourceCode: z.string().max(100).optional(),
  idempotencyKey: z.string().min(12).max(120),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]).default("PICKUP"),
  address: z
    .object({
      street: z.string().trim().min(2),
      number: z.string().trim().min(1),
      neighborhood: z.string().trim().min(2),
      reference: z.string().trim().max(120).optional()
    })
    .optional(),
  customer: z.object({
    name: z.string().trim().min(2),
    whatsapp: z.string().trim().min(10).max(30)
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        requestedQuantity: z.number().int().positive()
      })
    )
    .min(1)
    .max(30)
});

export async function POST(request: NextRequest) {
  const anonymousId = request.cookies.get("deliveryreg_anon")?.value ?? randomUUID();

  try {
    const payload = orderInputSchema.parse(await request.json());
    const business = await getDefaultPublicBusiness();

    if (!business) {
      throw new AppError("NOT_FOUND");
    }

    const source = await resolveLeadSource({
      businessId: business.id,
      sourceCode: payload.sourceCode
    });

    const order = await createPickupOrder({
      businessId: business.id,
      branchId: payload.branchId,
      leadSourceId: source?.id,
      anonymousId,
      idempotencyKey: payload.idempotencyKey,
      fulfillmentType: payload.fulfillmentType,
      address: payload.address,
      customer: payload.customer,
      items: payload.items
    });

    const response = NextResponse.json(order, { status: 201 });
    response.cookies.set("deliveryreg_anon", anonymousId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365
    });

    return response;
  } catch (error) {
    const status = error instanceof AppError ? error.status : 400;
    const message =
      error instanceof AppError ? error.safeMessage : "Verifique os dados informados.";
    const response = NextResponse.json({ message }, { status });
    response.cookies.set("deliveryreg_anon", anonymousId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365
    });

    return response;
  }
}
