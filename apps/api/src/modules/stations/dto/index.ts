import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum StationType {
  generation_distribution = 'generation_distribution',
  solar = 'solar',
  distribution_only = 'distribution_only',
}

export class CreateStationDto {
  @ApiProperty({ description: 'اسم المحطة', example: 'محطة الصناعية' })
  @IsString()
  @IsNotEmpty({ message: 'اسم المحطة مطلوب' })
  name: string;

  @ApiPropertyOptional({ description: 'اسم المحطة بالإنجليزية', example: 'Industrial Station' })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({ description: 'نوع المحطة', enum: StationType, default: StationType.generation_distribution })
  @IsEnum(StationType)
  @IsOptional()
  type?: StationType;

  @ApiPropertyOptional({ description: 'الموقع' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'خط العرض', example: 15.3694 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول', example: 44.1910 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'هل تحتوي على مولدات', default: false })
  @IsBoolean()
  @IsOptional()
  hasGenerators?: boolean;

  @ApiPropertyOptional({ description: 'هل تحتوي على طاقة شمسية', default: false })
  @IsBoolean()
  @IsOptional()
  hasSolar?: boolean;
}

export class UpdateStationDto extends PartialType(CreateStationDto) {
  @ApiPropertyOptional({ description: 'حالة التفعيل' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class StationQueryDto {
  @ApiPropertyOptional({ description: 'البحث بالاسم' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'فلترة حسب النوع', enum: StationType })
  @IsEnum(StationType)
  @IsOptional()
  type?: StationType;

  @ApiPropertyOptional({ description: 'فلترة حسب الحالة' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 10 })
  @IsOptional()
  limit?: number = 10;
}

export class StationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() businessId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() nameEn?: string;
  @ApiProperty({ enum: StationType }) type: StationType;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional() latitude?: number;
  @ApiPropertyOptional() longitude?: number;
  @ApiProperty() hasGenerators: boolean;
  @ApiProperty() hasSolar: boolean;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedStationsDto {
  @ApiProperty({ type: [StationResponseDto] })
  data: StationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
