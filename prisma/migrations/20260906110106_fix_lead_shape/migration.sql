/*
  Warnings:

  - The values [REJECTED,COMPLETED] on the enum `LeadStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `facebook` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `googleMaps` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `tiktok` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp` on the `Lead` table. All the data in the column will be lost.
  - Added the required column `name` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LeadStatus_new" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');
ALTER TABLE "Lead" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "status" TYPE "LeadStatus_new" USING ("status"::text::"LeadStatus_new");
ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
DROP TYPE "LeadStatus_old";
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "facebook",
DROP COLUMN "fullName",
DROP COLUMN "googleMaps",
DROP COLUMN "instagram",
DROP COLUMN "tiktok",
DROP COLUMN "website",
DROP COLUMN "whatsapp",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
