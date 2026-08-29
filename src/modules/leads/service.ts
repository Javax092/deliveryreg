import { prisma } from "@/db/prisma";
import { recordAnalyticsEvent } from "@/modules/analytics/events";
import { normalizeBrazilianPhone } from "@/modules/leads/phone";
import { AppError } from "@/modules/shared/errors/app-error";

export async function createOrUpdateLead(input: {
  businessId: string;
  branchId?: string | null;
  leadSourceId?: string | null;
  anonymousId: string;
  name: string;
  whatsapp: string;
}) {
  const name = input.name.trim();

  if (name.length < 2) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Lead name is required."
    });
  }

  const normalizedPhone = normalizeBrazilianPhone(input.whatsapp);

  const lead = await prisma.lead.upsert({
    where: {
      businessId_normalizedPhone: {
        businessId: input.businessId,
        normalizedPhone
      }
    },
    update: {
      name,
      whatsapp: input.whatsapp.trim(),
      branchId: input.branchId,
      leadSourceId: input.leadSourceId,
      lastSeenAt: new Date()
    },
    create: {
      businessId: input.businessId,
      branchId: input.branchId,
      leadSourceId: input.leadSourceId,
      name,
      whatsapp: input.whatsapp.trim(),
      normalizedPhone
    }
  });

  await recordAnalyticsEvent({
    businessId: input.businessId,
    branchId: input.branchId,
    leadSourceId: input.leadSourceId,
    anonymousId: input.anonymousId,
    eventType: "lead_created"
  });

  return lead;
}
