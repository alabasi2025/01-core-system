import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean, IsArray, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum ScopeType {
  business = 'business',
  station = 'station',
}

export class CreateUserDto {
  @ApiProperty({ description: 'اسم المستخدم', example: 'محمد أحمد' })
  @IsString()
  @IsNotEmpty({ message: 'اسم المستخدم مطلوب' })
  name: string;

  @ApiProperty({ description: 'البريد الإلكتروني', example: 'user@electricity.com' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف', example: '+967777123456' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'كلمة المرور', example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  password: string;

  @ApiPropertyOptional({ description: 'نطاق الصلاحية', enum: ScopeType, default: ScopeType.station })
  @IsEnum(ScopeType)
  @IsOptional()
  scopeType?: ScopeType;

  @ApiPropertyOptional({ description: 'معرفات المحطات المسموح بها', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  scopeIds?: string[];

  @ApiPropertyOptional({ description: 'معرفات الأدوار', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'حالة التفعيل' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UserQueryDto {
  @ApiPropertyOptional({ description: 'البحث بالاسم أو البريد' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'فلترة حسب الحالة' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'فلترة حسب الدور' })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 10 })
  @IsOptional()
  limit?: number = 10;
}

export class AssignRolesDto {
  @ApiProperty({ description: 'معرفات الأدوار', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  roleIds: string[];
}

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() phone?: string;
  @ApiProperty() businessId: string;
  @ApiProperty() scopeType: string;
  @ApiPropertyOptional() scopeIds?: string[];
  @ApiProperty() isOwner: boolean;
  @ApiProperty() isActive: boolean;
  @ApiPropertyOptional() lastLogin?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() roles: { id: string; name: string }[];
}

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
