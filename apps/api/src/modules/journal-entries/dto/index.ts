import { IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum, IsArray, ValidateNested, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum EntryStatus {
  draft = 'draft',     // مسودة
  posted = 'posted',   // مرحّل
  voided = 'voided',   // ملغي
}

export class JournalEntryLineDto {
  @ApiProperty({ description: 'معرف الحساب' })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ description: 'المبلغ المدين', default: 0 })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ description: 'المبلغ الدائن', default: 0 })
  @IsNumber()
  @Min(0)
  credit: number;

  @ApiPropertyOptional({ description: 'وصف السطر' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsUUID()
  @IsOptional()
  stationId?: string;

  @ApiProperty({ description: 'تاريخ القيد', example: '2025-01-15' })
  @IsDateString()
  @IsNotEmpty({ message: 'تاريخ القيد مطلوب' })
  entryDate: string;

  @ApiPropertyOptional({ description: 'وصف القيد' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'نوع المرجع (فاتورة، سند، إلخ)' })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'معرف المرجع' })
  @IsUUID()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ description: 'سطور القيد', type: [JournalEntryLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  @IsNotEmpty({ message: 'سطور القيد مطلوبة' })
  lines: JournalEntryLineDto[];
}

export class UpdateJournalEntryDto {
  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsUUID()
  @IsOptional()
  stationId?: string;

  @ApiPropertyOptional({ description: 'تاريخ القيد' })
  @IsDateString()
  @IsOptional()
  entryDate?: string;

  @ApiPropertyOptional({ description: 'وصف القيد' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'سطور القيد', type: [JournalEntryLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  @IsOptional()
  lines?: JournalEntryLineDto[];
}

export class JournalEntryQueryDto {
  @ApiPropertyOptional({ description: 'البحث برقم القيد أو الوصف' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'فلترة حسب المحطة' })
  @IsUUID()
  @IsOptional()
  stationId?: string;

  @ApiPropertyOptional({ description: 'فلترة حسب الحالة', enum: EntryStatus })
  @IsEnum(EntryStatus)
  @IsOptional()
  status?: EntryStatus;

  @ApiPropertyOptional({ description: 'من تاريخ' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'إلى تاريخ' })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 10 })
  @IsOptional()
  limit?: number = 10;
}

export class JournalEntryLineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() accountId: string;
  @ApiProperty() accountCode: string;
  @ApiProperty() accountName: string;
  @ApiProperty() debit: number;
  @ApiProperty() credit: number;
  @ApiPropertyOptional() description?: string;
}

export class JournalEntryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() businessId: string;
  @ApiPropertyOptional() stationId?: string;
  @ApiPropertyOptional() stationName?: string;
  @ApiProperty() entryNumber: string;
  @ApiProperty() entryDate: Date;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() referenceType?: string;
  @ApiPropertyOptional() referenceId?: string;
  @ApiProperty() totalDebit: number;
  @ApiProperty() totalCredit: number;
  @ApiProperty({ enum: EntryStatus }) status: EntryStatus;
  @ApiProperty() createdBy: string;
  @ApiProperty() createdByName: string;
  @ApiPropertyOptional() postedBy?: string;
  @ApiPropertyOptional() postedByName?: string;
  @ApiPropertyOptional() postedAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: [JournalEntryLineResponseDto] }) lines: JournalEntryLineResponseDto[];
}

export class PaginatedJournalEntriesDto {
  @ApiProperty({ type: [JournalEntryResponseDto] })
  data: JournalEntryResponseDto[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
