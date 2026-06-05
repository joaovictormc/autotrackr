-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FuelType" ADD VALUE 'GASOLINA_ADITIVADA';
ALTER TYPE "FuelType" ADD VALUE 'GASOLINA_PODIUM';

-- AlterTable
ALTER TABLE "fuel_records" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
