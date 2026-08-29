import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { resolveLeadSource } from "@/modules/leads/source";
import { createOrUpdateLead } from "@/modules/leads/service";
import { getDefaultPublicBusiness } from "@/modules/public-catalog/queries";
import { AppError } from "@/modules/shared/errors/app-error";

const leadInputSchema = z.object({
  productId: z.string().max(120).optional(),
  sourceCode: z.string().max(100).optional(),
  name: z.string().trim().min(2),
  whatsapp: z.string().trim().min(10).max(30)
});

export async function POST(request: NextRequest) {
  const anonymousId = request.cookies.get("deliveryreg_anon")?.value ?? randomUUID();
  const responseHeaders = new Headers();

  try {
    const payload = leadInputSchema.parse(await request.json());
    const business = await getDefaultPublicBusiness();

    if (!business) {
      throw new AppError("NOT_FOUND");
    }

    const source = await resolveLeadSource({
      businessId: business.id,
      sourceCode: payload.sourceCode
    });

    const lead = await createOrUpdateLead({
      businessId: business.id,
      branchId: source?.branchId,
      leadSourceId: source?.id,
      anonymousId,
      name: payload.name,
      whatsapp: payload.whatsapp
    });

    const response = NextResponse.json(
      {
        leadId: lead.id,
        message: "Interesse registrado com sucesso."
      },
      {
        headers: responseHeaders
      }
    );
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
