import { IsNotEmpty, IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class UpdateBusinessDto {
  @ApiPropertyOptional({ description: 'اسم المجموعة', example: 'شركة الكهرباء' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'اسم المجموعة بالإنجليزية', example: 'Electricity Company' })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({ description: 'الشعار (URL)' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ description: 'العنوان' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'البريد الإلكتروني' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'الرقم الضريبي' })
  @IsString()
  @IsOptional()
  taxNumber?: string;
}

export class BusinessResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() nameEn?: string;
  @ApiPropertyOptional() logo?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() taxNumber?: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() stationsCount: number;
  @ApiProperty() usersCount: number;
}
