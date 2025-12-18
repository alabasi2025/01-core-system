import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Clearing Account DTOs ====================

export enum ClearingAccountType {
  bank = 'bank',
  revenue = 'revenue',
  expense = 'expense',
  receivable = 'receivable',
}

export class CreateClearingAccountDto {
  @IsUUID()
  accountId: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsEnum(ClearingAccountType)
  type: ClearingAccountType;
}

export class UpdateClearingAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Clearing Entry DTOs ====================

export enum ClearingEntryStatus {
  pending = 'pending',
  matched = 'matched',
  allocated = 'allocated',
  closed = 'closed',
}

export class CreateClearingEntryDto {
  @IsUUID()
  clearingAccountId: string;

  @IsDateString()
  entryDate: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsString()
  referenceType: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateClearingEntryDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ClearingEntryStatus)
  status?: ClearingEntryStatus;
}

export class ClearingEntryFilterDto {
  @IsOptional()
  @IsUUID()
  clearingAccountId?: string;

  @IsOptional()
  @IsEnum(ClearingEntryStatus)
  status?: ClearingEntryStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}

// ==================== Reconciliation Basket DTOs ====================

export class AddToBasketDto {
  @IsUUID()
  entryId: string;

  @IsEnum(['debit', 'credit'])
  side: 'debit' | 'credit';
}

export class ReconcileBasketDto {
  @IsArray()
  @IsUUID('4', { each: true })
  debitEntryIds: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  creditEntryIds: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
