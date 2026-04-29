CREATE TABLE "event_shipping_orders" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "hostName" TEXT,
  "hostEmail" TEXT,
  "shippingName" TEXT,
  "shippingAddress" TEXT,
  "shippingCity" TEXT,
  "shippingState" TEXT,
  "shippingZip" TEXT,
  "totalKits" INTEGER NOT NULL,
  "paidBookingCount" INTEGER NOT NULL,
  "shippingAmountCents" INTEGER NOT NULL DEFAULT 0,
  "shippingProvider" TEXT,
  "shippingService" TEXT,
  "shippingEstimatedDays" INTEGER,
  "shippingArrivesBy" TEXT,
  "shippingEstimateLabel" TEXT,
  "shippoShipmentId" TEXT,
  "shippoRateId" TEXT,
  "shippoOrderId" TEXT,
  "shippoOrderStatus" TEXT,
  "shippoTransactionId" TEXT,
  "trackingCarrier" TEXT,
  "trackingNumber" TEXT,
  "trackingStatus" TEXT,
  "trackingStatusDetails" TEXT,
  "trackingUrl" TEXT,
  "labelUrl" TEXT,
  "qrCodeUrl" TEXT,
  "packingSlipUrl" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" "ShopOrderStatus" NOT NULL DEFAULT 'PAID',
  "preparedEmailSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "event_shipping_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_shipping_orders_eventId_key" ON "event_shipping_orders"("eventId");
CREATE INDEX "event_shipping_orders_status_createdAt_idx" ON "event_shipping_orders"("status", "createdAt");
CREATE INDEX "event_shipping_orders_hostEmail_idx" ON "event_shipping_orders"("hostEmail");
CREATE INDEX "event_shipping_orders_shippoOrderId_idx" ON "event_shipping_orders"("shippoOrderId");
CREATE INDEX "event_shipping_orders_trackingNumber_idx" ON "event_shipping_orders"("trackingNumber");

ALTER TABLE "event_shipping_orders"
  ADD CONSTRAINT "event_shipping_orders_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
