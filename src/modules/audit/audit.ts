import type { AuditAction, Prisma } from "@prisma/client";

import type { prisma } from "@/db/prisma";

export async function writeAuditLog(input: {
  tx: Pick<typeof prisma, "auditLog">;
  businessId: string;
  branchId?: string;
  actorUserId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}) {
  return input.tx.auditLog.create({
    data: {
      businessId: input.businessId,
      branchId: input.branchId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before,
      after: input.after,
      metadata: input.metadata
    }
  });
}
