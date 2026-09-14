-- AlterTable
ALTER TABLE "ProfileLink" ADD COLUMN     "collectionTitle" TEXT,
ADD COLUMN     "layout" TEXT NOT NULL DEFAULT 'STACK',
ADD COLUMN     "thumbnailUrl" TEXT;
