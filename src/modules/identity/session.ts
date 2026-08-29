import { createHash } from "node:crypto";
import { randomBytes } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(input: {
  prisma: PrismaClient;
  userId: string;
  ttlMs?: number;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? 8 * 60 * 60 * 1000));

  await input.prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash: hashSessionToken(token),
      expiresAt
    }
  });

  return { token, expiresAt };
}
