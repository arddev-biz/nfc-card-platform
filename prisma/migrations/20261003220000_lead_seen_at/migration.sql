BEGIN;
ALTER TABLE "Lead" ADD COLUMN "seenAt" TIMESTAMP(3);
-- Existing inquiries are not new notifications. Future inserts default to NULL.
UPDATE "Lead" SET "seenAt" = CURRENT_TIMESTAMP;
CREATE INDEX "Lead_seenAt_idx" ON "Lead"("seenAt");
COMMIT;
