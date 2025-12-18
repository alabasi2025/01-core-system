import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum AccountType {
  asset = 'asset',           // أصول
  liability = 'liability',   // خصوم
  equity = 'equity',         // حقوق الملكية
  revenue = 'revenue',       // إيرادات
  expense = 'expense',       // مصروفات
}

export enum AccountNature {
  debit = 'debit',   // مدين
  credit = 'credit', // دائن
}

export class CreateAccountDto {
  @ApiProperty({ description: 'كود الحساب', example: '1100' })
  @IsString()
  @IsNotEmpty({ message: 'كود الحساب مطلوب' })
  code: string;

  @ApiProperty({ description: 'اسم الحساب', example: 'الصندوق' })
  @IsString()
  @IsNotEmpty({ message: 'اسم الحساب مطلوب' })
  name: string;

  @ApiPropertyOptional({ description: 'اسم الحساب بالإنجليزية', example: 'Cash' })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiProperty({ description: 'نوع الحساب', enum: AccountType })
  @IsEnum(AccountType)
  @IsNotEmpty({ message: 'نوع الحساب مطلوب' })
  type: AccountType;

  @ApiProperty({ description: 'طبيعة الحساب', enum: AccountNature })
  @IsEnum(AccountNature)
  @IsNotEmpty({ message: 'طبيعة الحساب مطلوبة' })
  nature: AccountNature;

  @ApiPropertyOptional({ description: 'معرف الحساب الأب' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'مستوى الحساب', default: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({ description: 'هل هو حساب رئيسي', default: false })
  @IsBoolean()
  @IsOptional()
  isParent?: boolean;

  @ApiPropertyOptional({ description: 'الحساب النظامي (للربط مع النظام)' })
  @IsString()
  @IsOptional()
  systemAccount?: string;

  @ApiPropertyOptional({ description: 'وصف الحساب' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @ApiPropertyOptional({ description: 'حالة التفعيل' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AccountQueryDto {
  @ApiPropertyOptional({ description: 'البحث بالاسم أو الكود' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'فلترة حسب النوع', enum: AccountType })
  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @ApiPropertyOptional({ description: 'فلترة حسب الحساب الأب' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'فلترة حسب الحالة' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'عرض الحسابات الفرعية فقط', default: false })
  @IsBoolean()
  @IsOptional()
  leafOnly?: boolean;
}

export class AccountResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() businessId: string;
  @ApiPropertyOptional() parentId?: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() nameEn?: string;
  @ApiProperty({ enum: AccountType }) type: AccountType;
  @ApiProperty({ enum: AccountNature }) nature: AccountNature;
  @ApiProperty() level: number;
  @ApiProperty() isParent: boolean;
  @ApiProperty() isActive: boolean;
  @ApiPropertyOptional() systemAccount?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional({ type: [Object] }) children?: AccountResponseDto[];
}

export class AccountTreeDto {
  @ApiProperty({ type: [AccountResponseDto] })
  assets: AccountResponseDto[];

  @ApiProperty({ type: [AccountResponseDto] })
  liabilities: AccountResponseDto[];

  @ApiProperty({ type: [AccountResponseDto] })
  equity: AccountResponseDto[];

  @ApiProperty({ type: [AccountResponseDto] })
  revenue: AccountResponseDto[];

  @ApiProperty({ type: [AccountResponseDto] })
  expenses: AccountResponseDto[];
}
