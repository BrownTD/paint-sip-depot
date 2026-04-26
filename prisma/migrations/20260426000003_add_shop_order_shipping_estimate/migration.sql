ALTER TABLE "shop_orders"
  ADD COLUMN "shippingEstimatedDays" INTEGER,
  ADD COLUMN "shippingArrivesBy" TEXT,
  ADD COLUMN "shippingEstimateLabel" TEXT;
