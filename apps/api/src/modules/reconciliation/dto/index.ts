import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Reconciliation DTOs ====================

export enum ReconciliationType {
  bank = 'bank',
  revenue = 'revenue',
  expense = 'expense',
  receivable = 'receivable',
}

export enum ReconciliationStatus {
  draft = 'draft',
  in_progress = 'in_progress',
  pending_review = 'pending_review',
  finalized = 'finalized',
  cancelled = 'cancelled',
}

export class CreateReconciliationDto {
  @IsEnum(ReconciliationType)
  type: ReconciliationType;

  @IsString()
  name: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  clearingAccountIds?: string[];
}

export class UpdateReconciliationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ReconciliationStatus)
  status?: ReconciliationStatus;
}

export class ReconciliationFilterDto {
  @IsOptional()
  @IsEnum(ReconciliationType)
  type?: ReconciliationType;

  @IsOptional()
  @IsEnum(ReconciliationStatus)
  status?: ReconciliationStatus;

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

// ==================== Reconciliation Rule DTOs ====================

export class CreateReconciliationRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priority?: number = 1;

  @IsArray()
  matchFields: string[];

  @IsOptional()
  tolerance?: {
    amount?: number;
    dateDays?: number;
  };
}

export class UpdateReconciliationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priority?: number;

  @IsOptional()
  @IsArray()
  matchFields?: string[];

  @IsOptional()
  tolerance?: {
    amount?: number;
    dateDays?: number;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Match DTOs ====================

export enum MatchType {
  one_to_one = 'one_to_one',
  one_to_many = 'one_to_many',
  many_to_one = 'many_to_one',
  many_to_many = 'many_to_many',
  manual = 'manual',
}

export class CreateMatchDto {
  @IsUUID()
  reconciliationId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  sourceEntryIds: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  targetEntryIds: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AutoMatchDto {
  @IsUUID()
  reconciliationId: string;

  @IsOptional()
  @IsUUID()
  ruleId?: string;
}

// ==================== Allocation DTOs ====================

export class CreateAllocationDto {
  @IsUUID()
  reconciliationId: string;

  @IsUUID()
  clearingEntryId: string;

  @IsUUID()
  targetAccountId: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;
}

// ==================== Exception DTOs ====================

export enum ExceptionType {
  unmatched = 'unmatched',
  amount_mismatch = 'amount_mismatch',
  date_mismatch = 'date_mismatch',
  duplicate = 'duplicate',
  missing = 'missing',
  other = 'other',
}

export class ResolveExceptionDto {
  @IsString()
  resolution: string;
}
