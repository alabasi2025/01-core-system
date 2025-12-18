-- CreateEnum
CREATE TYPE "StationType" AS ENUM ('generation_distribution', 'solar', 'distribution_only');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('business', 'station');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- CreateEnum
CREATE TYPE "AccountNature" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('draft', 'posted', 'voided');

-- CreateTable
CREATE TABLE "core_businesses" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255),
    "logo" VARCHAR(500),
    "address" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "tax_number" VARCHAR(50),
    "settings" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_stations" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255),
    "type" "StationType" NOT NULL DEFAULT 'generation_distribution',
    "location" VARCHAR(255),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "has_generators" BOOLEAN NOT NULL DEFAULT false,
    "has_solar" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_settings" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "station_id" UUID,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_users" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "scope_type" "ScopeType" NOT NULL DEFAULT 'station',
    "scope_ids" JSONB DEFAULT '[]',
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_roles" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_permissions" (
    "id" UUID NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),

    CONSTRAINT "core_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_accounts" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "parent_id" UUID,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "name_en" VARCHAR(255),
    "type" "AccountType" NOT NULL,
    "nature" "AccountNature" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "is_parent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "system_account" VARCHAR(50),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_journal_entries" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "station_id" UUID,
    "entry_number" VARCHAR(50) NOT NULL,
    "entry_date" DATE NOT NULL,
    "description" TEXT,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "total_debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "EntryStatus" NOT NULL DEFAULT 'draft',
    "created_by" UUID NOT NULL,
    "posted_by" UUID,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_journal_entry_lines" (
    "id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_accounting_periods" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "closed_at" TIMESTAMP(3),
    "closed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_accounting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "record_id" UUID NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "core_stations_business_id_idx" ON "core_stations"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "core_settings_business_id_station_id_key_key" ON "core_settings"("business_id", "station_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "core_users_email_key" ON "core_users"("email");

-- CreateIndex
CREATE INDEX "core_users_business_id_idx" ON "core_users"("business_id");

-- CreateIndex
CREATE INDEX "core_users_email_idx" ON "core_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "core_roles_business_id_name_key" ON "core_roles"("business_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "core_permissions_module_action_key" ON "core_permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "core_role_permissions_role_id_permission_id_key" ON "core_role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "core_user_roles_user_id_role_id_key" ON "core_user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "core_refresh_tokens_token_key" ON "core_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "core_refresh_tokens_user_id_idx" ON "core_refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "core_refresh_tokens_token_idx" ON "core_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "core_accounts_business_id_idx" ON "core_accounts"("business_id");

-- CreateIndex
CREATE INDEX "core_accounts_parent_id_idx" ON "core_accounts"("parent_id");

-- CreateIndex
CREATE INDEX "core_accounts_type_idx" ON "core_accounts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "core_accounts_business_id_code_key" ON "core_accounts"("business_id", "code");

-- CreateIndex
CREATE INDEX "core_journal_entries_business_id_idx" ON "core_journal_entries"("business_id");

-- CreateIndex
CREATE INDEX "core_journal_entries_station_id_idx" ON "core_journal_entries"("station_id");

-- CreateIndex
CREATE INDEX "core_journal_entries_entry_date_idx" ON "core_journal_entries"("entry_date");

-- CreateIndex
CREATE INDEX "core_journal_entries_status_idx" ON "core_journal_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "core_journal_entries_business_id_entry_number_key" ON "core_journal_entries"("business_id", "entry_number");

-- CreateIndex
CREATE INDEX "core_journal_entry_lines_journal_entry_id_idx" ON "core_journal_entry_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "core_journal_entry_lines_account_id_idx" ON "core_journal_entry_lines"("account_id");

-- CreateIndex
CREATE INDEX "core_accounting_periods_business_id_idx" ON "core_accounting_periods"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "core_accounting_periods_business_id_name_key" ON "core_accounting_periods"("business_id", "name");

-- CreateIndex
CREATE INDEX "core_audit_logs_user_id_idx" ON "core_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "core_audit_logs_table_name_idx" ON "core_audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "core_audit_logs_record_id_idx" ON "core_audit_logs"("record_id");

-- CreateIndex
CREATE INDEX "core_audit_logs_created_at_idx" ON "core_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "core_stations" ADD CONSTRAINT "core_stations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "core_businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_settings" ADD CONSTRAINT "core_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "core_businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_users" ADD CONSTRAINT "core_users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "core_businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_roles" ADD CONSTRAINT "core_roles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "core_businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_role_permissions" ADD CONSTRAINT "core_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_role_permissions" ADD CONSTRAINT "core_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "core_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_user_roles" ADD CONSTRAINT "core_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_user_roles" ADD CONSTRAINT "core_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_refresh_tokens" ADD CONSTRAINT "core_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_accounts" ADD CONSTRAINT "core_accounts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "core_businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_accounts" ADD CONSTRAINT "core_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "core_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_journal_entries" ADD CONSTRAINT "core_journal_entries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "core_businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_journal_entries" ADD CONSTRAINT "core_journal_entries_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "core_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_journal_entries" ADD CONSTRAINT "core_journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_journal_entries" ADD CONSTRAINT "core_journal_entries_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_journal_entry_lines" ADD CONSTRAINT "core_journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "core_journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_journal_entry_lines" ADD CONSTRAINT "core_journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "core_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_audit_logs" ADD CONSTRAINT "core_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
