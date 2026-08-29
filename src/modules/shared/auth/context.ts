import type { InternalRole } from "@prisma/client";

export type AuthContext = {
  userId: string;
  businessId: string;
  role: InternalRole;
  branchIds: string[];
};

export function canAccessBranch(context: AuthContext, branchId: string): boolean {
  if (context.role === "OWNER" || context.role === "MANAGER") {
    return true;
  }

  return context.branchIds.includes(branchId);
}
