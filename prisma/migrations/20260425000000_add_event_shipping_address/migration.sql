CREATE TYPE "EventFulfillmentMethod" AS ENUM ('SHIP_TO_HOST', 'PICKUP');

ALTER TABLE "events"
  ADD COLUMN "shippingRecipientName" TEXT,
  ADD COLUMN "shippingAddress" TEXT,
  ADD COLUMN "shippingCity" TEXT,
  ADD COLUMN "shippingState" TEXT,
  ADD COLUMN "shippingZip" TEXT,
  ADD COLUMN "fulfillmentMethod" "EventFulfillmentMethod" NOT NULL DEFAULT 'SHIP_TO_HOST';
