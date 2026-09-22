-- Record the background-column representation already used by production.
-- The conditional type conversions make this safe both for the existing
-- database (where these columns are already TEXT) and for a database built
-- from the local historical migrations (where they begin as enum columns).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'BusinessProfile'
      AND column_name = 'backgroundType'
      AND udt_name = 'BackgroundType'
  ) THEN
    ALTER TABLE "BusinessProfile"
      ALTER COLUMN "backgroundType" DROP DEFAULT,
      ALTER COLUMN "backgroundType" TYPE TEXT USING ("backgroundType"::TEXT);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'BusinessProfile'
      AND column_name = 'backgroundGradient'
      AND udt_name = 'BackgroundGradientPreset'
  ) THEN
    ALTER TABLE "BusinessProfile"
      ALTER COLUMN "backgroundGradient" TYPE TEXT USING ("backgroundGradient"::TEXT);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'BusinessProfile'
      AND column_name = 'backgroundMode'
      AND udt_name = 'BackgroundMode'
  ) THEN
    ALTER TABLE "BusinessProfile"
      ALTER COLUMN "backgroundMode" DROP DEFAULT,
      ALTER COLUMN "backgroundMode" TYPE TEXT USING ("backgroundMode"::TEXT);
  END IF;
END $$;

UPDATE "BusinessProfile"
SET "backgroundType" = 'SOLID'
WHERE "backgroundType" IS NULL;

UPDATE "BusinessProfile"
SET "backgroundMode" = 'LIGHT'
WHERE "backgroundMode" IS NULL;

ALTER TABLE "BusinessProfile"
  ALTER COLUMN "backgroundType" SET DEFAULT 'SOLID',
  ALTER COLUMN "backgroundType" SET NOT NULL,
  ALTER COLUMN "backgroundMode" SET DEFAULT 'LIGHT',
  ALTER COLUMN "backgroundMode" SET NOT NULL;
