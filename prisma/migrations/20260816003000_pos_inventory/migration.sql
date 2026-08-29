CREATE TYPE "SalesChannel" AS ENUM ('DIGITAL', 'POS');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'PIX', 'DEBIT_CARD', 'CREDIT_CARD');

ALTER TABLE "Order" ADD COLUMN "salesChannel" "SalesChannel" NOT NULL DEFAULT 'DIGITAL';

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "method" "PaymentMethod" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Payment_businessId_branchId_createdAt_idx" ON "Payment"("businessId", "branchId", "createdAt");
CREATE INDEX "Payment_businessId_orderId_idx" ON "Payment"("businessId", "orderId");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
