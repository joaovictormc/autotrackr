-- CreateEnum
CREATE TYPE "TripPurpose" AS ENUM ('WORK', 'PERSONAL', 'BUSINESS', 'OTHER');

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "distance_km" INTEGER NOT NULL,
    "mileage_start" INTEGER,
    "mileage_end" INTEGER,
    "duration_min" INTEGER,
    "purpose" "TripPurpose" NOT NULL DEFAULT 'PERSONAL',
    "passengers" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_vehicle_id_idx" ON "trips"("vehicle_id");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
