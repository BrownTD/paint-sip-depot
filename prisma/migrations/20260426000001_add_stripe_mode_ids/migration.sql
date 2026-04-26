ALTER TABLE "products"
  ADD COLUMN "stripeLiveProductId" TEXT,
  ADD COLUMN "stripeLivePriceId" TEXT,
  ADD COLUMN "stripeTestProductId" TEXT,
  ADD COLUMN "stripeTestPriceId" TEXT;

ALTER TABLE "product_variants"
  ADD COLUMN "stripeLivePriceId" TEXT,
  ADD COLUMN "stripeTestPriceId" TEXT;

UPDATE "products"
SET
  "stripeLiveProductId" = COALESCE("stripeLiveProductId", "stripeProductId"),
  "stripeLivePriceId" = COALESCE("stripeLivePriceId", "stripePriceId")
WHERE "stripeProductId" IS NOT NULL OR "stripePriceId" IS NOT NULL;

UPDATE "product_variants"
SET "stripeLivePriceId" = COALESCE("stripeLivePriceId", "stripePriceId")
WHERE "stripePriceId" IS NOT NULL;

CREATE UNIQUE INDEX "products_stripeLiveProductId_key" ON "products"("stripeLiveProductId");
CREATE UNIQUE INDEX "products_stripeLivePriceId_key" ON "products"("stripeLivePriceId");
CREATE UNIQUE INDEX "products_stripeTestProductId_key" ON "products"("stripeTestProductId");
CREATE UNIQUE INDEX "products_stripeTestPriceId_key" ON "products"("stripeTestPriceId");
CREATE UNIQUE INDEX "product_variants_stripeLivePriceId_key" ON "product_variants"("stripeLivePriceId");
CREATE UNIQUE INDEX "product_variants_stripeTestPriceId_key" ON "product_variants"("stripeTestPriceId");
