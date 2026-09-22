-- Approved additive Profile Builder V2 migration. No automatic conversion.
-- Generated offline from current prisma/schema.prisma to this directory's schema.prisma.
-- New CHECK constraints and bounded transaction added explicitly. No data conversion.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "builderVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "layoutRevision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'CLASSIC',
ADD COLUMN     "v2ConversionSnapshot" JSONB,
ADD COLUMN     "v2ConvertedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProfileLink" ADD COLUMN     "customIconAssetId" TEXT,
ADD COLUMN     "iconMode" TEXT NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "socialNetwork" TEXT,
ADD COLUMN     "socialSectionId" TEXT,
ADD COLUMN     "v2IsVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "width" TEXT NOT NULL DEFAULT 'FULL';

-- CreateTable
CREATE TABLE "ProfileSection" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "singletonKey" TEXT,
    "internalName" TEXT NOT NULL,
    "visibleTitle" TEXT,
    "position" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "configVersion" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileSectionItem" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "width" TEXT NOT NULL DEFAULT 'FULL',
    "configVersion" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB NOT NULL DEFAULT '{}',
    "referencedProfileLinkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileAsset" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileItemImage" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "caption" TEXT,
    "destinationUrl" TEXT,

    CONSTRAINT "ProfileItemImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileSection_businessProfileId_position_idx" ON "ProfileSection"("businessProfileId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSection_id_businessProfileId_key" ON "ProfileSection"("id", "businessProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSection_businessProfileId_singletonKey_key" ON "ProfileSection"("businessProfileId", "singletonKey");

-- CreateIndex
CREATE INDEX "ProfileSectionItem_sectionId_businessProfileId_position_idx" ON "ProfileSectionItem"("sectionId", "businessProfileId", "position");

-- CreateIndex
CREATE INDEX "ProfileSectionItem_referencedProfileLinkId_businessProfileI_idx" ON "ProfileSectionItem"("referencedProfileLinkId", "businessProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSectionItem_id_businessProfileId_key" ON "ProfileSectionItem"("id", "businessProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileAsset_url_key" ON "ProfileAsset"("url");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileAsset_pathname_key" ON "ProfileAsset"("pathname");

-- CreateIndex
CREATE INDEX "ProfileAsset_businessProfileId_idx" ON "ProfileAsset"("businessProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileAsset_id_businessProfileId_key" ON "ProfileAsset"("id", "businessProfileId");

-- CreateIndex
CREATE INDEX "ProfileItemImage_itemId_businessProfileId_position_idx" ON "ProfileItemImage"("itemId", "businessProfileId", "position");

-- CreateIndex
CREATE INDEX "ProfileItemImage_assetId_businessProfileId_idx" ON "ProfileItemImage"("assetId", "businessProfileId");

-- CreateIndex
CREATE INDEX "ProfileLink_customIconAssetId_businessProfileId_idx" ON "ProfileLink"("customIconAssetId", "businessProfileId");

-- CreateIndex
CREATE INDEX "ProfileLink_socialSectionId_businessProfileId_idx" ON "ProfileLink"("socialSectionId", "businessProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileLink_id_businessProfileId_key" ON "ProfileLink"("id", "businessProfileId");

-- AddForeignKey
ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_customIconAssetId_businessProfileId_fkey" FOREIGN KEY ("customIconAssetId", "businessProfileId") REFERENCES "ProfileAsset"("id", "businessProfileId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_socialSectionId_businessProfileId_fkey" FOREIGN KEY ("socialSectionId", "businessProfileId") REFERENCES "ProfileSection"("id", "businessProfileId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfileSection" ADD CONSTRAINT "ProfileSection_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfileSectionItem" ADD CONSTRAINT "ProfileSectionItem_sectionId_businessProfileId_fkey" FOREIGN KEY ("sectionId", "businessProfileId") REFERENCES "ProfileSection"("id", "businessProfileId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfileSectionItem" ADD CONSTRAINT "ProfileSectionItem_referencedProfileLinkId_businessProfile_fkey" FOREIGN KEY ("referencedProfileLinkId", "businessProfileId") REFERENCES "ProfileLink"("id", "businessProfileId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfileAsset" ADD CONSTRAINT "ProfileAsset_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfileItemImage" ADD CONSTRAINT "ProfileItemImage_itemId_businessProfileId_fkey" FOREIGN KEY ("itemId", "businessProfileId") REFERENCES "ProfileSectionItem"("id", "businessProfileId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfileItemImage" ADD CONSTRAINT "ProfileItemImage_assetId_businessProfileId_fkey" FOREIGN KEY ("assetId", "businessProfileId") REFERENCES "ProfileAsset"("id", "businessProfileId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- Prisma does not express these CHECK constraints; retain them in future migrations.
ALTER TABLE "BusinessProfile"
  ADD CONSTRAINT "BusinessProfile_builderVersion_check" CHECK ("builderVersion" IN (1, 2)),
  ADD CONSTRAINT "BusinessProfile_layoutRevision_check" CHECK ("layoutRevision" >= 0),
  ADD CONSTRAINT "BusinessProfile_theme_check" CHECK ("theme" IN ('CLASSIC', 'LIQUID_GLASS')),
  ADD CONSTRAINT "BusinessProfile_v2ConversionSnapshot_check"
    CHECK ("v2ConversionSnapshot" IS NULL OR jsonb_typeof("v2ConversionSnapshot") = 'object');

ALTER TABLE "ProfileLink"
  ADD CONSTRAINT "ProfileLink_width_check" CHECK ("width" IN ('FULL', 'HALF')),
  ADD CONSTRAINT "ProfileLink_iconMode_check" CHECK ("iconMode" IN ('DEFAULT', 'CUSTOM', 'NONE')),
  ADD CONSTRAINT "ProfileLink_customIcon_check" CHECK ("iconMode" <> 'CUSTOM' OR "customIconAssetId" IS NOT NULL);

ALTER TABLE "ProfileSection"
  ADD CONSTRAINT "ProfileSection_kind_singletonKey_check" CHECK (
    ("kind" = 'CORE' AND "singletonKey" IS NOT NULL AND "singletonKey" IN ('BIO', 'BUSINESS_INFO', 'LINKS', 'MENU'))
    OR ("kind" = 'SOCIALS' AND "singletonKey" IS NOT NULL AND "singletonKey" = 'SOCIALS')
    OR ("kind" = 'CUSTOM' AND "singletonKey" IS NULL)
  ),
  ADD CONSTRAINT "ProfileSection_position_check" CHECK ("position" >= 0),
  ADD CONSTRAINT "ProfileSection_configVersion_check" CHECK ("configVersion" >= 1),
  ADD CONSTRAINT "ProfileSection_config_check" CHECK (jsonb_typeof("config") = 'object');

ALTER TABLE "ProfileSectionItem"
  ADD CONSTRAINT "ProfileSectionItem_kind_check" CHECK (length(btrim("kind")) > 0),
  ADD CONSTRAINT "ProfileSectionItem_position_check" CHECK ("position" >= 0),
  ADD CONSTRAINT "ProfileSectionItem_width_check" CHECK ("width" IN ('FULL', 'HALF')),
  ADD CONSTRAINT "ProfileSectionItem_configVersion_check" CHECK ("configVersion" >= 1),
  ADD CONSTRAINT "ProfileSectionItem_config_check" CHECK (jsonb_typeof("config") = 'object');

ALTER TABLE "ProfileAsset"
  ADD CONSTRAINT "ProfileAsset_byteSize_check" CHECK ("byteSize" > 0 AND "byteSize" <= 5242880),
  ADD CONSTRAINT "ProfileAsset_mimeType_check" CHECK ("mimeType" IN ('image/jpeg', 'image/png', 'image/webp'));

ALTER TABLE "ProfileItemImage"
  ADD CONSTRAINT "ProfileItemImage_position_check" CHECK ("position" >= 0);

COMMIT;
