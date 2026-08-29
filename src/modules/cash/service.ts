import { Prisma, type CashMovementType, type PaymentMethod } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { writeAuditLog } from "@/modules/audit/audit";
import {
  affectsPhysicalCash,
  assertPositiveMoneyCents,
  calculateDifferenceCents,
  calculateExpectedCashCents,
  validateCashMovementReason,
  validateClosingNote
} from "@/modules/cash/calculations";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertPermission } from "@/modules/shared/auth/permissions";
import { AppError } from "@/modules/shared/errors/app-error";
import { hashRequestPayload, lockIdempotencyOperation } from "@/modules/shared/idempotency";

export type CashPosition = {
  openingAmountCents: number;
  cashPaymentsCents: number;
  nonCashPayments: Array<{ method: PaymentMethod; amountCents: number; count: number }>;
  suppliesCents: number;
  withdrawalsCents: number;
  expectedCashCents: number;
};

export async function listCashBranches(context: AuthContext) {
  assertPermission(context, "cash:read");

  return prisma.branch.findMany({
    where: {
      businessId: context.businessId,
      isActive: true,
      ...(context.branchIds.length > 0 ? { id: { in: context.branchIds } } : {})
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

export async function getCashWorkspace(input: {
  context: AuthContext;
  branchId?: string | null;
}) {
  assertPermission(input.context, "cash:read");

  const branches = await listCashBranches(input.context);
  const selectedBranchId = resolveSelectedBranchId({
    branchId: input.branchId ?? null,
    branches
  });
  const openSession = selectedBranchId
    ? await getOpenCashSession({
        context: input.context,
        branchId: selectedBranchId
      })
    : null;

  return {
    branches,
    selectedBranchId,
    openSession
  };
}

export async function getOpenCashSession(input: {
  context: AuthContext;
  branchId: string;
}) {
  assertPermission(input.context, "cash:read");
  await assertCashBranchAccess(input.context, input.branchId);

  const session = await prisma.cashSession.findFirst({
    where: {
      businessId: input.context.businessId,
      branchId: input.branchId,
      status: "OPEN"
    },
    include: {
      branch: { select: { name: true } },
      openedByUser: { select: { name: true } },
      movements: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          actor: { select: { name: true } }
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  return {
    ...session,
    position: await calculateCashPosition(session.id)
  };
}

export async function openCashSession(input: {
  context: AuthContext;
  branchId: string;
  openingAmountCents: number;
  idempotencyKey: string;
}) {
  assertPermission(input.context, "cash:operate");
  await assertCashBranchAccess(input.context, input.branchId);
  assertPositiveOrZero(input.openingAmountCents);

  const requestHash = hashRequestPayload({
    branchId: input.branchId,
    openingAmountCents: input.openingAmountCents
  });

  return prisma.$transaction(async (tx) => {
    await lockIdempotencyOperation({
      tx,
      businessId: input.context.businessId,
      operation: "open-cash-session",
      key: input.idempotencyKey
    });

    const existingKey = await getOrCreateIdempotencyKey({
      tx,
      businessId: input.context.businessId,
      operation: "open-cash-session",
      key: input.idempotencyKey,
      requestHash
    });

    if (existingKey.responseJson) {
      return existingKey.responseJson;
    }

    const alreadyOpen = await tx.cashSession.findFirst({
      where: {
        businessId: input.context.businessId,
        branchId: input.branchId,
        status: "OPEN"
      }
    });

    if (alreadyOpen) {
      throw new AppError("CONFLICT", {
        message: "There is already an open cash session for this branch."
      });
    }

    try {
      const session = await tx.cashSession.create({
        data: {
          businessId: input.context.businessId,
          branchId: input.branchId,
          openedByUserId: input.context.userId,
          openingAmountCents: input.openingAmountCents
        }
      });

      await writeAuditLog({
        tx,
        businessId: input.context.businessId,
        branchId: input.branchId,
        actorUserId: input.context.userId,
        action: "CASH_SESSION_OPENED",
        entityType: "CashSession",
        entityId: session.id,
        after: {
          openingAmountCents: session.openingAmountCents,
          status: session.status
        } satisfies Prisma.InputJsonValue
      });

      const response = {
        cashSessionId: session.id,
        status: session.status
      };

      await tx.idempotencyKey.update({
        where: { id: existingKey.id },
        data: { responseJson: response }
      });

      return response;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("CONFLICT", {
          message: "There is already an open cash session for this branch."
        });
      }

      throw error;
    }
  });
}

export async function createCashMovement(input: {
  context: AuthContext;
  cashSessionId: string;
  type: CashMovementType;
  amountCents: number;
  reason: string;
  idempotencyKey: string;
}) {
  assertPermission(input.context, "cash:operate");
  assertPositiveMoneyCents(input.amountCents);
  const reason = validateCashMovementReason(input.reason);
  const requestHash = hashRequestPayload({
    cashSessionId: input.cashSessionId,
    type: input.type,
    amountCents: input.amountCents,
    reason
  });

  return prisma.$transaction(async (tx) => {
    await lockIdempotencyOperation({
      tx,
      businessId: input.context.businessId,
      operation: "create-cash-movement",
      key: input.idempotencyKey
    });

    const existingKey = await getOrCreateIdempotencyKey({
      tx,
      businessId: input.context.businessId,
      operation: "create-cash-movement",
      key: input.idempotencyKey,
      requestHash
    });

    if (existingKey.responseJson) {
      return existingKey.responseJson;
    }

    const session = await tx.cashSession.findFirst({
      where: {
        id: input.cashSessionId,
        businessId: input.context.businessId
      }
    });

    if (!session) {
      throw new AppError("NOT_FOUND");
    }

    await assertCashBranchAccess(input.context, session.branchId);

    if (session.status !== "OPEN") {
      throw new AppError("INVALID_STATE_TRANSITION", {
        message: "Cash movement requires an open session."
      });
    }

    if (input.type === "WITHDRAWAL") {
      const position = await calculateCashPosition(session.id, tx);

      if (position.expectedCashCents < input.amountCents) {
        throw new AppError("VALIDATION_ERROR", {
          message: "Withdrawal cannot make expected cash negative."
        });
      }
    }

    const movement = await tx.cashMovement.create({
      data: {
        businessId: session.businessId,
        branchId: session.branchId,
        cashSessionId: session.id,
        actorUserId: input.context.userId,
        type: input.type,
        amountCents: input.amountCents,
        reason
      }
    });

    await writeAuditLog({
      tx,
      businessId: session.businessId,
      branchId: session.branchId,
      actorUserId: input.context.userId,
      action: input.type === "SUPPLY" ? "CASH_SUPPLY_CREATED" : "CASH_WITHDRAWAL_CREATED",
      entityType: "CashMovement",
      entityId: movement.id,
      after: {
        cashSessionId: session.id,
        type: movement.type,
        amountCents: movement.amountCents,
        reason: movement.reason
      } satisfies Prisma.InputJsonValue
    });

    const response = {
      cashMovementId: movement.id,
      cashSessionId: session.id,
      type: movement.type
    };

    await tx.idempotencyKey.update({
      where: { id: existingKey.id },
      data: { responseJson: response }
    });

    return response;
  });
}

export async function closeCashSession(input: {
  context: AuthContext;
  cashSessionId: string;
  countedCashCents: number;
  closingNote?: string | null;
  idempotencyKey: string;
}) {
  assertPermission(input.context, "cash:close");
  assertPositiveOrZero(input.countedCashCents);

  return prisma.$transaction(async (tx) => {
    await lockIdempotencyOperation({
      tx,
      businessId: input.context.businessId,
      operation: "close-cash-session",
      key: input.idempotencyKey
    });

    const session = await tx.cashSession.findFirst({
      where: {
        id: input.cashSessionId,
        businessId: input.context.businessId
      }
    });

    if (!session) {
      throw new AppError("NOT_FOUND");
    }

    await assertCashBranchAccess(input.context, session.branchId);

    const position = await calculateCashPosition(input.cashSessionId, tx);
    const differenceCents = calculateDifferenceCents({
      countedCashCents: input.countedCashCents,
      expectedCashCents: position.expectedCashCents
    });
    const closingNote = validateClosingNote({
      differenceCents,
      note: input.closingNote
    });
    const requestHash = hashRequestPayload({
      cashSessionId: input.cashSessionId,
      countedCashCents: input.countedCashCents,
      closingNote
    });

    const existingKey = await getOrCreateIdempotencyKey({
      tx,
      businessId: input.context.businessId,
      operation: "close-cash-session",
      key: input.idempotencyKey,
      requestHash
    });

    if (existingKey.responseJson) {
      return existingKey.responseJson;
    }

    if (session.status !== "OPEN") {
      throw new AppError("INVALID_STATE_TRANSITION", {
        message: "Cash session has already been closed."
      });
    }

    const update = await tx.cashSession.updateMany({
      where: {
        id: session.id,
        businessId: session.businessId,
        status: "OPEN"
      },
      data: {
        status: "CLOSED",
        closedByUserId: input.context.userId,
        closedAt: new Date(),
        expectedCashCents: position.expectedCashCents,
        countedCashCents: input.countedCashCents,
        differenceCents,
        closingNote
      }
    });

    if (update.count !== 1) {
      throw new AppError("CONFLICT", {
        message: "Cash session has already been closed."
      });
    }

    await writeAuditLog({
      tx,
      businessId: session.businessId,
      branchId: session.branchId,
      actorUserId: input.context.userId,
      action: "CASH_SESSION_CLOSED",
      entityType: "CashSession",
      entityId: session.id,
      before: {
        status: session.status
      } satisfies Prisma.InputJsonValue,
      after: {
        status: "CLOSED",
        expectedCashCents: position.expectedCashCents,
        countedCashCents: input.countedCashCents,
        differenceCents,
        closingNote
      } satisfies Prisma.InputJsonValue
    });

    const response = {
      cashSessionId: session.id,
      status: "CLOSED",
      expectedCashCents: position.expectedCashCents,
      countedCashCents: input.countedCashCents,
      differenceCents
    };

    await tx.idempotencyKey.update({
      where: { id: existingKey.id },
      data: { responseJson: response }
    });

    return response;
  });
}

export async function requireOpenCashSessionForPayment(input: {
  tx: Prisma.TransactionClient;
  context: AuthContext;
  branchId: string;
}) {
  await assertCashBranchAccess(input.context, input.branchId);

  const session = await input.tx.cashSession.findFirst({
    where: {
      businessId: input.context.businessId,
      branchId: input.branchId,
      status: "OPEN"
    },
    select: {
      id: true
    }
  });

  if (!session) {
    throw new AppError("INVALID_STATE_TRANSITION", {
      message: "Open cash session is required to register payment."
    });
  }

  return session;
}

export async function calculateCashPosition(
  cashSessionId: string,
  tx: Pick<typeof prisma, "cashSession" | "payment" | "cashMovement"> = prisma
): Promise<CashPosition> {
  const session = await tx.cashSession.findUnique({
    where: { id: cashSessionId },
    select: {
      id: true,
      openingAmountCents: true
    }
  });

  if (!session) {
    throw new AppError("NOT_FOUND");
  }

  const [payments, movements] = await Promise.all([
    tx.payment.groupBy({
      by: ["method"],
      where: {
        cashSessionId
      },
      _sum: {
        amountCents: true
      },
      _count: {
        _all: true
      }
    }),
    tx.cashMovement.groupBy({
      by: ["type"],
      where: {
        cashSessionId
      },
      _sum: {
        amountCents: true
      }
    })
  ]);

  const cashPaymentsCents = payments
    .filter((payment) => affectsPhysicalCash(payment.method))
    .reduce((total, payment) => total + (payment._sum.amountCents ?? 0), 0);
  const nonCashPayments = payments
    .filter((payment) => !affectsPhysicalCash(payment.method))
    .map((payment) => ({
      method: payment.method,
      amountCents: payment._sum.amountCents ?? 0,
      count: payment._count._all
    }));
  const suppliesCents = movements
    .filter((movement) => movement.type === "SUPPLY")
    .reduce((total, movement) => total + (movement._sum.amountCents ?? 0), 0);
  const withdrawalsCents = movements
    .filter((movement) => movement.type === "WITHDRAWAL")
    .reduce((total, movement) => total + (movement._sum.amountCents ?? 0), 0);

  return {
    openingAmountCents: session.openingAmountCents,
    cashPaymentsCents,
    nonCashPayments,
    suppliesCents,
    withdrawalsCents,
    expectedCashCents: calculateExpectedCashCents({
      openingAmountCents: session.openingAmountCents,
      cashPaymentsCents,
      suppliesCents,
      withdrawalsCents
    })
  };
}

export async function assertCashBranchAccess(context: AuthContext, branchId: string) {
  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      businessId: context.businessId
    },
    select: {
      id: true
    }
  });

  if (!branch) {
    throw new AppError("NOT_FOUND");
  }

  if (context.branchIds.length > 0 && !context.branchIds.includes(branchId)) {
    throw new AppError("AUTHORIZATION_ERROR", {
      message: "Cross-branch cash access denied."
    });
  }
}

function resolveSelectedBranchId(input: {
  branchId: string | null;
  branches: Array<{ id: string; name: string }>;
}) {
  if (input.branchId && input.branches.some((branch) => branch.id === input.branchId)) {
    return input.branchId;
  }

  return input.branches[0]?.id ?? null;
}

function assertPositiveOrZero(value: number) {
  if (!Number.isInteger(value) || value < 0) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Money must be a non-negative integer amount of cents."
    });
  }
}

async function getOrCreateIdempotencyKey(input: {
  tx: Prisma.TransactionClient;
  businessId: string;
  operation: string;
  key: string;
  requestHash: string;
}) {
  const existing = await input.tx.idempotencyKey.findUnique({
    where: {
      businessId_operation_key: {
        businessId: input.businessId,
        operation: input.operation,
        key: input.key
      }
    }
  });

  if (existing && existing.requestHash !== input.requestHash) {
    throw new AppError("CONFLICT", {
      message: "Idempotency key reused with different payload."
    });
  }

  return (
    existing ??
    input.tx.idempotencyKey.create({
      data: {
        businessId: input.businessId,
        operation: input.operation,
        key: input.key,
        requestHash: input.requestHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    })
  );
}
