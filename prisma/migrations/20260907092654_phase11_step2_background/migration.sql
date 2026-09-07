-- CreateEnum
CREATE TYPE "BackgroundType" AS ENUM ('SOLID', 'GRADIENT', 'IMAGE');

-- CreateEnum
CREATE TYPE "BackgroundGradientPreset" AS ENUM ('INDIGO', 'PURPLE', 'BLUE', 'SUNSET', 'EMERALD', 'ROSE', 'DARK');

-- CreateEnum
CREATE TYPE "BackgroundMode" AS ENUM ('LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "backgroundGradient" "BackgroundGradientPreset",
ADD COLUMN     "backgroundImageUrl" TEXT,
ADD COLUMN     "backgroundMode" "BackgroundMode",
ADD COLUMN     "backgroundType" "BackgroundType";
