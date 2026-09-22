-- Additive presentation metadata only. No conversion, backfill, or content updates.
BEGIN;
ALTER TABLE "BusinessProfile"
  ADD COLUMN "designConfig" JSONB,
  ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verificationColor" TEXT NOT NULL DEFAULT '#2563EB';
ALTER TABLE "BusinessProfile"
  ADD CONSTRAINT "BusinessProfile_designConfig_check"
    CHECK ("designConfig" IS NULL OR jsonb_typeof("designConfig") = 'object'),
  ADD CONSTRAINT "BusinessProfile_verificationColor_check"
    CHECK ("verificationColor" ~ '^#[0-9a-fA-F]{6}$');
COMMIT;
