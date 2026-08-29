CREATE TYPE "AnalyticsEventType" AS ENUM ('catalog_viewed', 'product_viewed', 'product_added', 'cart_viewed', 'checkout_started', 'lead_created', 'order_created', 'order_completed');

CREATE TABLE "LeadSource" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "branchId" TEXT,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "branchId" TEXT,
  "leadSourceId" TEXT,
  "customerId" TEXT,
  "name" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "normalizedPhone" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "branchId" TEXT,
  "leadSourceId" TEXT,
  "anonymousId" TEXT NOT NULL,
  "eventType" "AnalyticsEventType" NOT NULL,
  "productId" TEXT,
  "orderId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeadSource_businessId_code_key" ON "LeadSource"("businessId", "code");
CREATE INDEX "LeadSource_businessId_branchId_isActive_idx" ON "LeadSource"("businessId", "branchId", "isActive");
CREATE UNIQUE INDEX "Lead_businessId_normalizedPhone_key" ON "Lead"("businessId", "normalizedPhone");
CREATE INDEX "Lead_businessId_branchId_createdAt_idx" ON "Lead"("businessId", "branchId", "createdAt");
CREATE INDEX "Lead_businessId_leadSourceId_idx" ON "Lead"("businessId", "leadSourceId");
CREATE INDEX "AnalyticsEvent_businessId_eventType_occurredAt_idx" ON "AnalyticsEvent"("businessId", "eventType", "occurredAt");
CREATE INDEX "AnalyticsEvent_businessId_branchId_occurredAt_idx" ON "AnalyticsEvent"("businessId", "branchId", "occurredAt");
CREATE INDEX "AnalyticsEvent_businessId_leadSourceId_occurredAt_idx" ON "AnalyticsEvent"("businessId", "leadSourceId", "occurredAt");
CREATE INDEX "AnalyticsEvent_businessId_anonymousId_occurredAt_idx" ON "AnalyticsEvent"("businessId", "anonymousId", "occurredAt");

ALTER TABLE "LeadSource" ADD CONSTRAINT "LeadSource_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeadSource" ADD CONSTRAINT "LeadSource_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES "LeadSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES "LeadSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
