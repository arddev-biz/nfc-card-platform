BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE "CustomTheme" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameKey" TEXT NOT NULL,
  "description" TEXT,
  "design" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomTheme_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomTheme_nameKey_key" ON "CustomTheme"("nameKey");
COMMIT;
