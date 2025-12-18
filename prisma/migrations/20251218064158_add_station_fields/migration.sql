-- AlterTable
ALTER TABLE "core_stations" ADD COLUMN     "address" TEXT,
ADD COLUMN     "code" VARCHAR(20),
ADD COLUMN     "contact_email" VARCHAR(255),
ADD COLUMN     "contact_phone" VARCHAR(20),
ADD COLUMN     "generator_capacity" DECIMAL(10,2),
ADD COLUMN     "manager_name" VARCHAR(255),
ADD COLUMN     "manager_phone" VARCHAR(20),
ADD COLUMN     "solar_capacity" DECIMAL(10,2),
ADD COLUMN     "working_hours" VARCHAR(100);
