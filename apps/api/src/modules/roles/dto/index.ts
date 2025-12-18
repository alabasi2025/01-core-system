import { IsNotEmpty, IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'اسم الدور', example: 'محاسب' })
  @IsString()
  @IsNotEmpty({ message: 'اسم الدور مطلوب' })
  name: string;

  @ApiPropertyOptional({ description: 'اسم الدور بالإنجليزية', example: 'Accountant' })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({ description: 'وصف الدور' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'معرفات الصلاحيات', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class AssignPermissionsDto {
  @ApiProperty({ description: 'معرفات الصلاحيات', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  permissionIds: string[];
}

export class RoleResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() nameEn?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() isSystem: boolean;
  @ApiPropertyOptional() businessId?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: [Object] })
  permissions: { id: string; module: string; action: string; name: string }[];
}

export class RoleQueryDto {
  @ApiPropertyOptional({ description: 'البحث بالاسم' })
  @IsString()
  @IsOptional()
  search?: string;
}
