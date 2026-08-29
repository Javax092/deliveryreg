import { prisma } from "@/db/prisma";

const sourceCodePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSourceCode(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized || normalized.length > 80 || !sourceCodePattern.test(normalized)) {
    return null;
  }

  return normalized;
}

export function resolvePublicSourceCode(input: {
  origem?: string | null;
  source?: string | null;
}): string | undefined {
  return input.origem?.trim() || input.source?.trim() || undefined;
}

export async function resolveLeadSource(input: {
  businessId: string;
  sourceCode: string | null | undefined;
}) {
  const code = normalizeSourceCode(input.sourceCode);

  if (!code) {
    return null;
  }

  return prisma.leadSource.findFirst({
    where: {
      businessId: input.businessId,
      code,
      isActive: true
    },
    select: {
      id: true,
      businessId: true,
      branchId: true,
      code: true,
      label: true,
      branch: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}
