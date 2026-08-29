CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');

ALTER TABLE "Customer" ADD COLUMN "normalizedPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "leadId" TEXT;
ALTER TABLE "Order" ADD COLUMN "leadSourceId" TEXT;
ALTER TABLE "Order" ADD COLUMN "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'PICKUP';

CREATE UNIQUE INDEX "Customer_businessId_normalizedPhone_key" ON "Customer"("businessId", "normalizedPhone");
CREATE INDEX "Order_businessId_customerId_createdAt_idx" ON "Order"("businessId", "customerId", "createdAt");

ALTER TABLE "Order" ADD CONSTRAINT "Order_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES "LeadSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
