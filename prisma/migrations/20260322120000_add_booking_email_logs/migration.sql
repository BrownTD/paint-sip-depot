CREATE TYPE "BookingEmailType" AS ENUM ('EXPIRED_CHECKOUT');

CREATE TYPE "BookingEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "booking_email_logs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "emailType" "BookingEmailType" NOT NULL,
    "status" "BookingEmailStatus" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_email_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_email_logs_bookingId_emailType_key"
ON "booking_email_logs"("bookingId", "emailType");

CREATE INDEX "booking_email_logs_bookingId_emailType_status_idx"
ON "booking_email_logs"("bookingId", "emailType", "status");

ALTER TABLE "booking_email_logs"
ADD CONSTRAINT "booking_email_logs_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
