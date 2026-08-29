import { prisma } from "@/db/prisma";
import { getDefaultPublicBusiness } from "@/modules/public-catalog/queries";
import { resolveLeadSource } from "@/modules/leads/source";

export async function listPublicBranches(input?: { sourceCode?: string | null }) {
  const business = await getDefaultPublicBusiness();

  if (!business) {
    return [];
  }

  const source = await resolveLeadSource({
    businessId: business.id,
    sourceCode: input?.sourceCode
  });

  return prisma.branch.findMany({
    where: {
      businessId: business.id,
      isActive: true,
      ...(source?.branchId ? { id: source.branchId } : {})
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: "asc"
    }
  });
}
