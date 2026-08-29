CREATE TABLE "OrderStatusHistory" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderStatusHistory_businessId_orderId_createdAt_idx" ON "OrderStatusHistory"("businessId", "orderId", "createdAt");

ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
