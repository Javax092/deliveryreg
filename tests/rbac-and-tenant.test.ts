import { describe, expect, it } from "vitest";

import { assertBranchAccess, assertSameBusiness, businessScopedWhere } from "@/modules/business/tenant";
import { assertPermission } from "@/modules/shared/auth/permissions";
import type { AuthContext } from "@/modules/shared/auth/context";

const attendant: AuthContext = {
  userId: "user_a",
  businessId: "business_a",
  role: "ATTENDANT",
  branchIds: ["branch_a"]
};

describe("rbac and tenant isolation", () => {
  it("blocks forbidden role capabilities server-side", () => {
    expect(() => assertPermission(attendant, "users:manage")).toThrow(
      "Role ATTENDANT cannot users:manage."
    );
  });

  it("blocks cross-business access", () => {
    expect(() => assertSameBusiness(attendant, "business_b")).toThrow(
      "Cross-business access denied."
    );
  });

  it("blocks restricted cross-branch access", () => {
    expect(() =>
      assertBranchAccess(attendant, {
        businessId: "business_a",
        branchId: "branch_b"
      })
    ).toThrow("Cross-branch access denied.");
  });

  it("always scopes queries by authenticated business", () => {
    expect(businessScopedWhere(attendant, { status: "CREATED" })).toEqual({
      businessId: "business_a",
      status: "CREATED"
    });
  });
});
