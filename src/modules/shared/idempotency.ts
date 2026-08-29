import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";

export function hashRequestPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function lockIdempotencyOperation(input: {
  tx: Prisma.TransactionClient;
  businessId: string;
  operation: string;
  key: string;
}): Promise<void> {
  await input.tx.$executeRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(${input.businessId}),
      hashtext(${`${input.operation}:${input.key}`})
    )
  `;
}
