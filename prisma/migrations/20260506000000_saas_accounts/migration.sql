-- Extend role model for SaaS account separation.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VENUE_OWNER';

-- CreateEnum
CREATE TYPE "VenueVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Venue" ADD COLUMN "verificationStatus" "VenueVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Venue_ownerId_idx" ON "Venue"("ownerId");

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
