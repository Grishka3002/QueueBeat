-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('INDIVIDUAL_ENTREPRENEUR', 'LLC');

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "legalName" TEXT NOT NULL,
    "inn" TEXT NOT NULL,
    "kpp" TEXT,
    "ogrn" TEXT,
    "ogrnip" TEXT,
    "legalAddress" TEXT NOT NULL,
    "actualAddress" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "bankName" TEXT,
    "bankBik" TEXT,
    "bankAccount" TEXT,
    "corrAccount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_venueId_key" ON "BusinessProfile"("venueId");

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
