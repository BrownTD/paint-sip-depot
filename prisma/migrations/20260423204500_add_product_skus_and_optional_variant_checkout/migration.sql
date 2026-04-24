ALTER TABLE "products"
ADD COLUMN "sku" TEXT,
ADD COLUMN "skuSequence" INTEGER;

ALTER TABLE "product_variants"
ADD COLUMN "sku" TEXT;

ALTER TABLE "shop_order_items"
ALTER COLUMN "variantId" DROP NOT NULL;

WITH numbered_products AS (
  SELECT
    "id",
    "categoryId",
    ROW_NUMBER() OVER (PARTITION BY "categoryId" ORDER BY "createdAt", "id") AS seq
  FROM "products"
)
UPDATE "products" AS p
SET "skuSequence" = np.seq
FROM numbered_products AS np
WHERE p."id" = np."id";

UPDATE "products"
SET "sku" = CONCAT(
  'PSD-',
  UPPER(LEFT(REGEXP_REPLACE("categoryId", '^cat_', ''), 3)),
  '-STD-',
  LPAD("skuSequence"::text, 3, '0')
)
WHERE "sku" IS NULL;

UPDATE "product_variants" AS pv
SET "sku" = CONCAT(
  'PSD-',
  UPPER(LEFT(REGEXP_REPLACE(p."categoryId", '^cat_', ''), 3)),
  '-',
  CASE
    WHEN pv."size" = 'MEDIUM' THEN 'MED'
    WHEN pv."size" = 'LARGE' THEN 'LRG'
    ELSE 'STD'
  END,
  '-',
  LPAD(p."skuSequence"::text, 3, '0')
)
FROM "products" AS p
WHERE pv."productId" = p."id"
  AND pv."sku" IS NULL;

ALTER TABLE "products"
ALTER COLUMN "sku" SET NOT NULL,
ALTER COLUMN "skuSequence" SET NOT NULL;

ALTER TABLE "product_variants"
ALTER COLUMN "sku" SET NOT NULL;

CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE UNIQUE INDEX "products_categoryId_skuSequence_key" ON "products"("categoryId", "skuSequence");
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");
