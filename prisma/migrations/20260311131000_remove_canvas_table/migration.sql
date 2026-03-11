ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_canvasId_fkey";
DROP INDEX IF EXISTS "events_canvasId_idx";
ALTER TABLE "events" DROP COLUMN IF EXISTS "canvasId";
DROP TABLE IF EXISTS "canvases";
