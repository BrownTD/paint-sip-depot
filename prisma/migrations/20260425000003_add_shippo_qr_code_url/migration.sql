ALTER TABLE "bookings"
  ADD COLUMN "qrCodeUrl" TEXT;

ALTER TABLE "shop_orders"
  ADD COLUMN "qrCodeUrl" TEXT;
