-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINA', 'ETANOL', 'DIESEL', 'GNV', 'ELETRICO');

-- CreateTable
CREATE TABLE "fuel_records" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "mileage" INTEGER NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL,
    "price_per_unit" DECIMAL(8,3) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "full_tank" BOOLEAN NOT NULL DEFAULT true,
    "station" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_records" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fuel_records_vehicle_id_idx" ON "fuel_records"("vehicle_id");

-- CreateIndex
CREATE INDEX "revenue_records_vehicle_id_idx" ON "revenue_records"("vehicle_id");

-- AddForeignKey
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_records" ADD CONSTRAINT "revenue_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
