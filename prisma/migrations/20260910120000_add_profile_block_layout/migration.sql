-- CreateEnum
CREATE TYPE "ProfileBlockKey" AS ENUM ('BIO', 'CONTACT', 'LOCATION', 'REVIEWS', 'MENU', 'LINKS', 'BUSINESS_INFO');

-- CreateTable
CREATE TABLE "ProfileBlockLayout" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "blockKey" "ProfileBlockKey" NOT NULL,
    "position" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileBlockLayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileBlockLayout_businessProfileId_blockKey_key" ON "ProfileBlockLayout"("businessProfileId", "blockKey");

-- CreateIndex
CREATE INDEX "ProfileBlockLayout_businessProfileId_position_idx" ON "ProfileBlockLayout"("businessProfileId", "position");

-- AddForeignKey
ALTER TABLE "ProfileBlockLayout" ADD CONSTRAINT "ProfileBlockLayout_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
