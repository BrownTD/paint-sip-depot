-- Create enums
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "ProductVariantSize" AS ENUM ('MEDIUM', 'LARGE');
CREATE TYPE "ShopOrderStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'CANCELED', 'EXPIRED');

-- Create product taxonomy tables
CREATE TABLE "product_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_subcategories" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_subcategories_pkey" PRIMARY KEY ("id")
);

-- Create products and variants
CREATE TABLE "products" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrls" TEXT[] NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "stripeProductId" TEXT,
  "stripePriceId" TEXT,
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMP(3),
  "categoryId" TEXT NOT NULL,
  "subcategoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_variants" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "size" "ProductVariantSize" NOT NULL,
  "label" TEXT NOT NULL,
  "widthInches" INTEGER NOT NULL,
  "heightInches" INTEGER NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "stripePriceId" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- Create shop order tables
CREATE TABLE "shop_orders" (
  "id" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" "ShopOrderStatus" NOT NULL DEFAULT 'PENDING',
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "amountSubtotalCents" INTEGER NOT NULL,
  "amountTotalCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "shop_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shop_order_items" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "productNameSnapshot" TEXT NOT NULL,
  "variantLabelSnapshot" TEXT NOT NULL,
  "imageUrlSnapshot" TEXT,
  "quantity" INTEGER NOT NULL,
  "unitPriceCents" INTEGER NOT NULL,
  "totalPriceCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "shop_order_items_pkey" PRIMARY KEY ("id")
);

-- Indexes and unique constraints
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");
CREATE INDEX "product_categories_createdAt_idx" ON "product_categories"("createdAt");

CREATE UNIQUE INDEX "product_subcategories_categoryId_slug_key" ON "product_subcategories"("categoryId", "slug");
CREATE INDEX "product_subcategories_categoryId_idx" ON "product_subcategories"("categoryId");

CREATE UNIQUE INDEX "products_normalizedName_key" ON "products"("normalizedName");
CREATE UNIQUE INDEX "products_stripeProductId_key" ON "products"("stripeProductId");
CREATE UNIQUE INDEX "products_stripePriceId_key" ON "products"("stripePriceId");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "products_subcategoryId_idx" ON "products"("subcategoryId");
CREATE INDEX "products_status_createdAt_idx" ON "products"("status", "createdAt");
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

CREATE UNIQUE INDEX "product_variants_productId_size_key" ON "product_variants"("productId", "size");
CREATE UNIQUE INDEX "product_variants_stripePriceId_key" ON "product_variants"("stripePriceId");
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

CREATE UNIQUE INDEX "shop_orders_stripeCheckoutSessionId_key" ON "shop_orders"("stripeCheckoutSessionId");
CREATE INDEX "shop_orders_status_createdAt_idx" ON "shop_orders"("status", "createdAt");
CREATE INDEX "shop_orders_customerEmail_idx" ON "shop_orders"("customerEmail");

CREATE INDEX "shop_order_items_orderId_idx" ON "shop_order_items"("orderId");
CREATE INDEX "shop_order_items_productId_idx" ON "shop_order_items"("productId");
CREATE INDEX "shop_order_items_variantId_idx" ON "shop_order_items"("variantId");

-- Foreign keys
ALTER TABLE "product_subcategories"
ADD CONSTRAINT "product_subcategories_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "products"
ADD CONSTRAINT "products_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "products"
ADD CONSTRAINT "products_subcategoryId_fkey"
FOREIGN KEY ("subcategoryId") REFERENCES "product_subcategories"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_variants"
ADD CONSTRAINT "product_variants_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shop_order_items"
ADD CONSTRAINT "shop_order_items_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "shop_orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shop_order_items"
ADD CONSTRAINT "shop_order_items_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shop_order_items"
ADD CONSTRAINT "shop_order_items_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed categories
INSERT INTO "product_categories" ("id", "name", "slug")
VALUES
  ('cat_canvases', 'Canvases', 'canvases'),
  ('cat_brushes', 'Brushes', 'brushes'),
  ('cat_aprons', 'Aprons', 'aprons'),
  ('cat_easels', 'Easels', 'easels'),
  ('cat_palettes', 'Palettes', 'palettes'),
  ('cat_paint', 'Paint', 'paint')
ON CONFLICT ("id") DO NOTHING;

-- Seed canvas subcategories
INSERT INTO "product_subcategories" ("id", "categoryId", "name", "slug")
VALUES
  ('sub_canvases_girls_night', 'cat_canvases', 'Girl''s Night', 'girls-night'),
  ('sub_canvases_everyone_welcome', 'cat_canvases', 'Everyone Welcome', 'everyone-welcome'),
  ('sub_canvases_kids_family', 'cat_canvases', 'Kids & Family', 'kids-family'),
  ('sub_canvases_sports_teams', 'cat_canvases', 'Sports & Teams', 'sports-teams'),
  ('sub_canvases_sororities', 'cat_canvases', 'Sororities', 'sororities'),
  ('sub_canvases_fraternities', 'cat_canvases', 'Fraternities', 'fraternities'),
  ('sub_canvases_faith_community', 'cat_canvases', 'Faith & Community', 'faith-community'),
  ('sub_canvases_celebrity_influencer', 'cat_canvases', 'Celebrity & Influencer', 'celebrity-influencer'),
  ('sub_canvases_mature_audience', 'cat_canvases', 'Mature Audience', 'mature-audience'),
  ('sub_canvases_couples_date_night', 'cat_canvases', 'Couples & Date Night', 'couples-date-night')
ON CONFLICT ("id") DO NOTHING;
