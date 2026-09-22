-- Independent Super Admin verification metadata; no backfill or content changes.
BEGIN;
ALTER TABLE "BusinessProfile" ADD COLUMN "verificationTooltip" TEXT;
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_verificationTooltip_check"
  CHECK ("verificationTooltip" IS NULL OR (length("verificationTooltip") <= 200 AND "verificationTooltip" !~ '[<>]'));
COMMIT;
