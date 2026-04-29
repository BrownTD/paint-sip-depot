CREATE TABLE "event_host_kit_reminders" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "reminderType" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "provider" TEXT NOT NULL DEFAULT 'resend',

  CONSTRAINT "event_host_kit_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_host_kit_reminders_eventId_reminderType_recipientEmail_key"
  ON "event_host_kit_reminders"("eventId", "reminderType", "recipientEmail");
CREATE INDEX "event_host_kit_reminders_eventId_idx" ON "event_host_kit_reminders"("eventId");
CREATE INDEX "event_host_kit_reminders_reminderType_sentAt_idx"
  ON "event_host_kit_reminders"("reminderType", "sentAt");

ALTER TABLE "event_host_kit_reminders"
  ADD CONSTRAINT "event_host_kit_reminders_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
