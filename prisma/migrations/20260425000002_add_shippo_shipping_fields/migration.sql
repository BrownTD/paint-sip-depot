ALTER TABLE "bookings"
  ADD COLUMN "shippingAmountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "shippingProvider" TEXT,
  ADD COLUMN "shippingService" TEXT,
  ADD COLUMN "shippoShipmentId" TEXT,
  ADD COLUMN "shippoRateId" TEXT,
  ADD COLUMN "shippoOrderId" TEXT,
  ADD COLUMN "shippoOrderStatus" TEXT,
  ADD COLUMN "shippoTransactionId" TEXT,
  ADD COLUMN "trackingCarrier" TEXT,
  ADD COLUMN "trackingNumber" TEXT,
  ADD COLUMN "trackingStatus" TEXT,
  ADD COLUMN "trackingStatusDetails" TEXT,
  ADD COLUMN "trackingUrl" TEXT,
  ADD COLUMN "labelUrl" TEXT,
  ADD COLUMN "packingSlipUrl" TEXT;

ALTER TABLE "shop_orders"
  ADD COLUMN "shippingName" TEXT,
  ADD COLUMN "shippingAddress" TEXT,
  ADD COLUMN "shippingCity" TEXT,
  ADD COLUMN "shippingState" TEXT,
  ADD COLUMN "shippingZip" TEXT,
  ADD COLUMN "shippingPhone" TEXT,
  ADD COLUMN "shippingAmountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "shippingProvider" TEXT,
  ADD COLUMN "shippingService" TEXT,
  ADD COLUMN "shippoShipmentId" TEXT,
  ADD COLUMN "shippoRateId" TEXT,
  ADD COLUMN "shippoOrderId" TEXT,
  ADD COLUMN "shippoOrderStatus" TEXT,
  ADD COLUMN "shippoTransactionId" TEXT,
  ADD COLUMN "trackingCarrier" TEXT,
  ADD COLUMN "trackingNumber" TEXT,
  ADD COLUMN "trackingStatus" TEXT,
  ADD COLUMN "trackingStatusDetails" TEXT,
  ADD COLUMN "trackingUrl" TEXT,
  ADD COLUMN "labelUrl" TEXT,
  ADD COLUMN "packingSlipUrl" TEXT;

CREATE INDEX "bookings_shippoOrderId_idx" ON "bookings"("shippoOrderId");
CREATE INDEX "bookings_trackingNumber_idx" ON "bookings"("trackingNumber");
CREATE INDEX "shop_orders_shippoOrderId_idx" ON "shop_orders"("shippoOrderId");
CREATE INDEX "shop_orders_trackingNumber_idx" ON "shop_orders"("trackingNumber");
