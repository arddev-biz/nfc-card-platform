/*
  Warnings:

  - Added the required column `updatedAt` to the `ProfileLink` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LinkType" ADD VALUE 'EMAIL';
ALTER TYPE "LinkType" ADD VALUE 'GOOGLE_REVIEWS';

-- AlterTable
ALTER TABLE "ProfileLink" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "ProfileLink_businessProfileId_sortOrder_idx" ON "ProfileLink"("businessProfileId", "sortOrder");
