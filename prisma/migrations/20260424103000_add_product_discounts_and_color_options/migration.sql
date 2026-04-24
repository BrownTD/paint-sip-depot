ALTER TABLE "public"."products"
ADD COLUMN "discountPercent" INTEGER;

CREATE TABLE "public"."product_color_options" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_color_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_color_options_productId_label_key" ON "public"."product_color_options"("productId", "label");
CREATE INDEX "product_color_options_productId_sortOrder_idx" ON "public"."product_color_options"("productId", "sortOrder");

ALTER TABLE "public"."shop_order_items"
ADD COLUMN "colorOptionId" TEXT,
ADD COLUMN "colorLabelSnapshot" TEXT;

CREATE INDEX "shop_order_items_colorOptionId_idx" ON "public"."shop_order_items"("colorOptionId");

ALTER TABLE "public"."product_color_options"
ADD CONSTRAINT "product_color_options_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."shop_order_items"
ADD CONSTRAINT "shop_order_items_colorOptionId_fkey"
FOREIGN KEY ("colorOptionId") REFERENCES "public"."product_color_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
