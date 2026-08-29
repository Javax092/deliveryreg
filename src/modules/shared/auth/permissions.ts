import { cookies } from "next/headers";

import { prisma } from "@/db/prisma";
import { AppError } from "@/modules/shared/errors/app-error";
import type { AuthContext } from "@/modules/shared/auth/context";
import { hashSessionToken } from "@/modules/identity/session";

export type Permission =
  | "business:manage"
  | "branches:manage"
  | "users:manage"
  | "orders:read"
  | "orders:write"
  | "orders:complete"
  | "inventory:read"
  | "inventory:write"
  | "delivery:manage"
  | "delivery:assigned:read"
  | "audit:read"
  | "cash:read"
  | "cash:operate"
  | "cash:close";

const rolePermissions: Record<AuthContext["role"], Permission[]> = {
  OWNER: [
    "business:manage",
    "branches:manage",
    "users:manage",
    "orders:read",
    "orders:write",
    "orders:complete",
    "inventory:read",
    "inventory:write",
    "delivery:manage",
    "delivery:assigned:read",
    "audit:read",
    "cash:read",
    "cash:operate",
    "cash:close"
  ],
  MANAGER: [
    "branches:manage",
    "orders:read",
    "orders:write",
    "orders:complete",
    "inventory:read",
    "inventory:write",
    "delivery:manage",
    "delivery:assigned:read",
    "audit:read",
    "cash:read",
    "cash:operate",
    "cash:close"
  ],
  ATTENDANT: ["orders:read", "orders:write", "orders:complete", "inventory:read", "cash:read", "cash:operate"],
  DELIVERY: ["delivery:assigned:read"]
};

export function hasPermission(context: AuthContext, permission: Permission): boolean {
  return rolePermissions[context.role].includes(permission);
}

export function assertPermission(context: AuthContext, permission: Permission): void {
  if (!hasPermission(context, permission)) {
    throw new AppError("AUTHORIZATION_ERROR", {
      message: `Role ${context.role} cannot ${permission}.`
    });
  }
}

export async function getCurrentUserContext(): Promise<AuthContext> {
  const sessionToken = (await cookies()).get("deliveryreg_session")?.value;

  if (!sessionToken) {
    throw new AppError("AUTHENTICATION_ERROR");
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(sessionToken) },
    include: {
      user: {
        include: {
          branchAccesses: true
        }
      }
    }
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) {
    throw new AppError("AUTHENTICATION_ERROR");
  }

  return {
    userId: session.user.id,
    businessId: session.user.businessId,
    role: session.user.role,
    branchIds: session.user.branchAccesses.map((access) => access.branchId)
  };
}

export async function requirePermission(permission: Permission): Promise<AuthContext> {
  const context = await getCurrentUserContext();
  assertPermission(context, permission);
  return context;
}
