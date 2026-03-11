CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

CREATE TYPE "EventFormat" AS ENUM ('IN_PERSON', 'VIRTUAL');

ALTER TABLE "events"
ADD COLUMN "eventCode" TEXT,
ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "eventFormat" "EventFormat" NOT NULL DEFAULT 'IN_PERSON',
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "state" DROP NOT NULL,
ALTER COLUMN "zip" DROP NOT NULL;

UPDATE "events"
SET "eventCode" = CONCAT('PSD-', UPPER(SUBSTRING(MD5(id) FROM 1 FOR 5)))
WHERE "eventCode" IS NULL;

ALTER TABLE "events"
ALTER COLUMN "eventCode" SET NOT NULL;

CREATE UNIQUE INDEX "events_eventCode_key" ON "events"("eventCode");
CREATE INDEX "events_visibility_status_startDateTime_idx" ON "events"("visibility", "status", "startDateTime");
