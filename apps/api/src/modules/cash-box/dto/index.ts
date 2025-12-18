import { IsString, IsOptional, IsNumber, IsUUID, IsBoolean, IsEnum, IsDateString, Min } from 'class-validator';

// ==================== Cash Box DTOs ====================

export class CreateCashBoxDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  clearingAccountId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxLimit?: number;
}

export class UpdateCashBoxDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  clearingAccountId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Collector DTOs ====================

export class CreateCollectorDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  cashBoxId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCollectionLimit?: number;
}

export class UpdateCollectorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  cashBoxId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCollectionLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Session DTOs ====================

export class OpenCashBoxSessionDto {
  @IsUUID()
  cashBoxId: string;

  @IsNumber()
  @Min(0)
  openingBalance: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseCashBoxSessionDto {
  @IsNumber()
  @Min(0)
  closingBalance: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class OpenCollectorSessionDto {
  @IsUUID()
  collectorId: string;

  @IsNumber()
  @Min(0)
  openingBalance: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseCollectorSessionDto {
  @IsNumber()
  @Min(0)
  closingBalance: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ==================== Transaction DTOs ====================

export enum CashBoxTransactionType {
  collection = 'collection',
  deposit = 'deposit',
  withdrawal = 'withdrawal',
  transfer_in = 'transfer_in',
  transfer_out = 'transfer_out',
  expense = 'expense',
  adjustment = 'adjustment',
}

export class CreateCashBoxTransactionDto {
  @IsUUID()
  cashBoxId: string;

  @IsEnum(CashBoxTransactionType)
  type: CashBoxTransactionType;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  collectorId?: string;
}

// ==================== Collection DTOs ====================

export enum PaymentMethod {
  cash = 'cash',
  check = 'check',
  bank_transfer = 'bank_transfer',
  pos = 'pos',
  mobile = 'mobile',
}

export class CreateCollectionDto {
  @IsUUID()
  collectorId: string;

  @IsString()
  receiptNumber: string;

  @IsDateString()
  collectionDate: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DepositCollectionsDto {
  @IsString({ each: true })
  collectionIds: string[];

  @IsString()
  depositReference: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
