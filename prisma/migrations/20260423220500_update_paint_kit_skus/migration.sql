UPDATE "products"
SET "sku" = REGEXP_REPLACE("sku", '^PSD-CAN-', 'PSD-KIT-')
WHERE "categoryId" = 'cat_canvases'
  AND "sku" LIKE 'PSD-CAN-%';

UPDATE "product_variants" AS pv
SET "sku" = REGEXP_REPLACE(pv."sku", '^PSD-CAN-', 'PSD-KIT-')
FROM "products" AS p
WHERE pv."productId" = p."id"
  AND p."categoryId" = 'cat_canvases'
  AND pv."sku" LIKE 'PSD-CAN-%';
