import { AppError } from "@/modules/shared/errors/app-error";
import { canAccessBranch, type AuthContext } from "@/modules/shared/auth/context";

export function assertSameBusiness(context: AuthContext, businessId: string): void {
  if (context.businessId !== businessId) {
    throw new AppError("AUTHORIZATION_ERROR", {
      message: "Cross-business access denied."
    });
  }
}

export function assertBranchAccess(context: AuthContext, input: {
  businessId: string;
  branchId: string;
}): void {
  assertSameBusiness(context, input.businessId);

  if (!canAccessBranch(context, input.branchId)) {
    throw new AppError("AUTHORIZATION_ERROR", {
      message: "Cross-branch access denied."
    });
  }
}

export function businessScopedWhere<T extends object>(
  context: AuthContext,
  where: T
): T & { businessId: string } {
  return {
    ...where,
    businessId: context.businessId
  };
}
