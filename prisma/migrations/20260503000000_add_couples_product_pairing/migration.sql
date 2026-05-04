ALTER TABLE "products"
ADD COLUMN "couplesGroupId" TEXT,
ADD COLUMN "couplesSlot" INTEGER,
ADD COLUMN "couplesBundleName" TEXT;

CREATE UNIQUE INDEX "products_couplesGroupId_couplesSlot_key" ON "products"("couplesGroupId", "couplesSlot");
CREATE INDEX "products_couplesGroupId_idx" ON "products"("couplesGroupId");
