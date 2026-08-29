CREATE TABLE "ProductCategory" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductBranchAvailability" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductBranchAvailability_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Product" ADD COLUMN "slug" TEXT;
ALTER TABLE "Product" ADD COLUMN "description" TEXT;
ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT;
UPDATE "Product" SET "slug" = "id" WHERE "slug" IS NULL;
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "ProductCategory_businessId_slug_key" ON "ProductCategory"("businessId", "slug");
CREATE INDEX "ProductCategory_businessId_isActive_sortOrder_idx" ON "ProductCategory"("businessId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "Product_businessId_slug_key" ON "Product"("businessId", "slug");
CREATE INDEX "Product_businessId_categoryId_idx" ON "Product"("businessId", "categoryId");
CREATE UNIQUE INDEX "ProductBranchAvailability_businessId_branchId_productId_key" ON "ProductBranchAvailability"("businessId", "branchId", "productId");
CREATE INDEX "ProductBranchAvailability_businessId_branchId_isAvailable_idx" ON "ProductBranchAvailability"("businessId", "branchId", "isAvailable");
CREATE INDEX "ProductBranchAvailability_businessId_productId_idx" ON "ProductBranchAvailability"("businessId", "productId");

ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductBranchAvailability" ADD CONSTRAINT "ProductBranchAvailability_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductBranchAvailability" ADD CONSTRAINT "ProductBranchAvailability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
