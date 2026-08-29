import { prisma } from "@/db/prisma";
import { calculateCashPosition, assertCashBranchAccess } from "@/modules/cash/service";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertPermission } from "@/modules/shared/auth/permissions";

export async function listCashHistory(input: {
  context: AuthContext;
  branchId?: string | null;
  from?: Date;
  to?: Date;
}) {
  assertPermission(input.context, "cash:read");
  const branchIds = await resolveCashBranchIds(input.context, input.branchId ?? null);

  return prisma.cashSession.findMany({
    where: {
      businessId: input.context.businessId,
      branchId: { in: branchIds },
      openedAt: {
        gte: input.from,
        lt: input.to
      }
    },
    include: {
      branch: { select: { name: true } },
      openedByUser: { select: { name: true } },
      closedByUser: { select: { name: true } }
    },
    orderBy: {
      openedAt: "desc"
    },
    take: 50
  });
}

export async function getCashSessionDetail(input: {
  context: AuthContext;
  cashSessionId: string;
}) {
  assertPermission(input.context, "cash:read");

  const session = await prisma.cashSession.findFirst({
    where: {
      id: input.cashSessionId,
      businessId: input.context.businessId
    },
    include: {
      branch: { select: { name: true } },
      openedByUser: { select: { name: true } },
      closedByUser: { select: { name: true } },
      movements: {
        orderBy: { createdAt: "asc" },
        include: {
          actor: { select: { name: true } }
        }
      },
      payments: {
        orderBy: { createdAt: "asc" },
        include: {
          order: { select: { id: true, salesChannel: true } }
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  await assertCashBranchAccess(input.context, session.branchId);

  return {
    ...session,
    position: await calculateCashPosition(session.id)
  };
}

export async function getCashSummaryForPanel(input: {
  context: AuthContext;
  branchId?: string | null;
}) {
  assertPermission(input.context, "cash:read");
  const branchIds = await resolveCashBranchIds(input.context, input.branchId ?? null);

  const sessions = await prisma.cashSession.findMany({
    where: {
      businessId: input.context.businessId,
      branchId: { in: branchIds },
      status: "OPEN"
    },
    include: {
      branch: { select: { name: true } },
      openedByUser: { select: { name: true } }
    },
    orderBy: {
      openedAt: "asc"
    }
  });

  return Promise.all(
    sessions.map(async (session) => ({
      ...session,
      position: await calculateCashPosition(session.id)
    }))
  );
}

export async function getCashDivergenceSummary(input: {
  context: AuthContext;
  from: Date;
  to: Date;
  branchId?: string | null;
}) {
  assertPermission(input.context, "cash:read");
  const branchIds = await resolveCashBranchIds(input.context, input.branchId ?? null);

  const result = await prisma.cashSession.aggregate({
    where: {
      businessId: input.context.businessId,
      branchId: { in: branchIds },
      status: "CLOSED",
      closedAt: {
        gte: input.from,
        lt: input.to
      }
    },
    _count: {
      _all: true
    },
    _sum: {
      differenceCents: true
    }
  });

  return {
    closedSessions: result._count._all,
    netDifferenceCents: result._sum.differenceCents ?? 0
  };
}

async function resolveCashBranchIds(context: AuthContext, requestedBranchId: string | null) {
  const branches = await prisma.branch.findMany({
    where: {
      businessId: context.businessId,
      isActive: true,
      ...(context.branchIds.length > 0 ? { id: { in: context.branchIds } } : {})
    },
    select: {
      id: true
    }
  });
  const allowed = branches.map((branch) => branch.id);

  if (requestedBranchId && allowed.includes(requestedBranchId)) {
    return [requestedBranchId];
  }

  return allowed;
}
