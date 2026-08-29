CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TYPE "CashMovementType" AS ENUM ('SUPPLY', 'WITHDRAWAL');

ALTER TYPE "AuditAction" ADD VALUE 'CASH_SESSION_OPENED';
ALTER TYPE "AuditAction" ADD VALUE 'CASH_SUPPLY_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CASH_WITHDRAWAL_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CASH_SESSION_CLOSED';

CREATE TABLE "CashSession" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "openedByUserId" TEXT NOT NULL,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "openingAmountCents" INTEGER NOT NULL,
  "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
  "closedByUserId" TEXT,
  "closedAt" TIMESTAMP(3),
  "expectedCashCents" INTEGER,
  "countedCashCents" INTEGER,
  "differenceCents" INTEGER,
  "closingNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CashSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashMovement" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "cashSessionId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "type" "CashMovementType" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Payment" ADD COLUMN "cashSessionId" TEXT;

CREATE UNIQUE INDEX "CashSession_one_open_per_branch_idx"
  ON "CashSession"("businessId", "branchId")
  WHERE "status" = 'OPEN';

CREATE INDEX "CashSession_businessId_branchId_status_idx" ON "CashSession"("businessId", "branchId", "status");
CREATE INDEX "CashSession_businessId_openedAt_idx" ON "CashSession"("businessId", "openedAt");
CREATE INDEX "CashSession_businessId_closedAt_idx" ON "CashSession"("businessId", "closedAt");
CREATE INDEX "CashMovement_businessId_branchId_createdAt_idx" ON "CashMovement"("businessId", "branchId", "createdAt");
CREATE INDEX "CashMovement_businessId_cashSessionId_createdAt_idx" ON "CashMovement"("businessId", "cashSessionId", "createdAt");
CREATE INDEX "Payment_businessId_cashSessionId_idx" ON "Payment"("businessId", "cashSessionId");

ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_openingAmountCents_check" CHECK ("openingAmountCents" >= 0);
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_expectedCashCents_check" CHECK ("expectedCashCents" IS NULL OR "expectedCashCents" >= 0);
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_countedCashCents_check" CHECK ("countedCashCents" IS NULL OR "countedCashCents" >= 0);
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_amountCents_check" CHECK ("amountCents" > 0);
