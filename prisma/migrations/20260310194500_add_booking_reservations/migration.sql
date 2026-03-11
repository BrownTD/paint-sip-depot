CREATE TYPE "BookingStatus_new" AS ENUM (
  'PENDING',
  'RESERVED',
  'PAID',
  'REFUNDED',
  'EXPIRED',
  'CANCELED'
);

ALTER TABLE "bookings"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "bookings"
ALTER COLUMN "status" TYPE "BookingStatus_new"
USING ("status"::text::"BookingStatus_new");

DROP TYPE "BookingStatus";

ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";

ALTER TABLE "bookings"
ADD COLUMN "reservationExpiresAt" TIMESTAMP(3);

ALTER TABLE "bookings"
ALTER COLUMN "status" SET DEFAULT 'RESERVED';

CREATE INDEX "bookings_eventId_status_reservationExpiresAt_idx"
ON "bookings"("eventId", "status", "reservationExpiresAt");
