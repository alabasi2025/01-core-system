import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID, IsEnum, IsDateString, Min, Max } from 'class-validator';

export enum ServiceType {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
  CONSUMPTION = 'consumption',
  PREPAID = 'prepaid',
}

export enum PriceType {
  FIXED = 'fixed',
  PER_UNIT = 'per_unit',
  TIERED = 'tiered',
  PERCENTAGE = 'percentage',
}

export enum CustomerType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  GOVERNMENT = 'government',
  AGRICULTURAL = 'agricultural',
}

// ==================== فئات الخدمات ====================

export class CreateServiceCategoryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceCategoryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== الخدمات ====================

export class CreateServiceDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsUUID()
  revenueAccountId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresMeter?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsUUID()
  revenueAccountId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresMeter?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== أسعار الخدمات ====================

export class CreateServicePriceDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxQuantity?: number;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServicePriceDto {
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxQuantity?: number;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== شرائح التسعير ====================

export class CreateServiceTierDto {
  @IsUUID()
  serviceId: string;

  @IsString()
  tierName: string;

  @IsNumber()
  @Min(0)
  fromQuantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  toQuantity?: number;

  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedCharge?: number;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceTierDto {
  @IsOptional()
  @IsString()
  tierName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fromQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  toQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedCharge?: number;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== حساب السعر ====================

export class CalculatePriceDto {
  @IsUUID()
  serviceId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
