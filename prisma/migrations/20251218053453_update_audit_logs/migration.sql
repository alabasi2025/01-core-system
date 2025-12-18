/*
  Warnings:

  - You are about to drop the column `new_values` on the `core_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `old_values` on the `core_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `record_id` on the `core_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `table_name` on the `core_audit_logs` table. All the data in the column will be lost.
  - Added the required column `business_id` to the `core_audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entity_id` to the `core_audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entity_type` to the `core_audit_logs` table without a default value. This is not possible if the table is not empty.
  - Made the column `user_id` on table `core_audit_logs` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "core_audit_logs" DROP CONSTRAINT "core_audit_logs_user_id_fkey";

-- DropIndex
DROP INDEX "core_audit_logs_record_id_idx";

-- DropIndex
DROP INDEX "core_audit_logs_table_name_idx";

-- AlterTable
ALTER TABLE "core_audit_logs" DROP COLUMN "new_values",
DROP COLUMN "old_values",
DROP COLUMN "record_id",
DROP COLUMN "table_name",
ADD COLUMN     "business_id" UUID NOT NULL,
ADD COLUMN     "description" VARCHAR(500),
ADD COLUMN     "entity_id" UUID NOT NULL,
ADD COLUMN     "entity_type" VARCHAR(100) NOT NULL,
ADD COLUMN     "new_value" TEXT,
ADD COLUMN     "old_value" TEXT,
ALTER COLUMN "user_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "core_audit_logs_business_id_idx" ON "core_audit_logs"("business_id");

-- CreateIndex
CREATE INDEX "core_audit_logs_entity_type_idx" ON "core_audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "core_audit_logs_entity_id_idx" ON "core_audit_logs"("entity_id");

-- AddForeignKey
ALTER TABLE "core_audit_logs" ADD CONSTRAINT "core_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_audit_logs" ADD CONSTRAINT "core_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "core_businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
