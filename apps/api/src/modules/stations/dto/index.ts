import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsEmail, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum StationType {
  generation_distribution = 'generation_distribution',
  solar = 'solar',
  distribution_only = 'distribution_only',
}

export class CreateStationDto {
  @ApiPropertyOptional({ description: 'معرف المحطة الأم (للمحطات الفرعية)' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'رمز المحطة', example: 'ST001' })
  @IsString()
  @IsOptional()
  code?: string;

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

  @ApiPropertyOptional({ description: 'العنوان التفصيلي' })
  @IsString()
  @IsOptional()
  address?: string;

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

  @ApiPropertyOptional({ description: 'سعة المولدات بالكيلوواط', example: 500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  generatorCapacity?: number;

  @ApiPropertyOptional({ description: 'سعة الطاقة الشمسية بالكيلوواط', example: 100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  solarCapacity?: number;

  @ApiPropertyOptional({ description: 'اسم مدير المحطة' })
  @IsString()
  @IsOptional()
  managerName?: string;

  @ApiPropertyOptional({ description: 'هاتف مدير المحطة' })
  @IsString()
  @IsOptional()
  managerPhone?: string;

  @ApiPropertyOptional({ description: 'هاتف المحطة' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'بريد المحطة' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'ساعات العمل', example: '08:00 - 17:00' })
  @IsString()
  @IsOptional()
  workingHours?: string;
}

export class UpdateStationDto extends PartialType(CreateStationDto) {
  @ApiPropertyOptional({ description: 'حالة التفعيل' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class StationQueryDto {
  @ApiPropertyOptional({ description: 'البحث بالاسم أو الرمز' })
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

  @ApiPropertyOptional({ description: 'فلترة حسب المحطة الأم' })
  @IsString()
  @IsOptional()
  parentId?: string;

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
  @ApiPropertyOptional() parentId?: string;
  @ApiPropertyOptional() code?: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() nameEn?: string;
  @ApiProperty({ enum: StationType }) type: StationType;
  @ApiProperty() level: number;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() latitude?: number;
  @ApiPropertyOptional() longitude?: number;
  @ApiProperty() hasGenerators: boolean;
  @ApiProperty() hasSolar: boolean;
  @ApiPropertyOptional() generatorCapacity?: number;
  @ApiPropertyOptional() solarCapacity?: number;
  @ApiPropertyOptional() managerName?: string;
  @ApiPropertyOptional() managerPhone?: string;
  @ApiPropertyOptional() contactPhone?: string;
  @ApiPropertyOptional() contactEmail?: string;
  @ApiPropertyOptional() workingHours?: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional() parent?: { id: string; name: string; code?: string };
  @ApiPropertyOptional() childrenCount?: number;
  @ApiPropertyOptional() usersCount?: number;
  @ApiPropertyOptional() entriesCount?: number;
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

export class StationStatisticsDto {
  @ApiProperty() totalStations: number;
  @ApiProperty() activeStations: number;
  @ApiProperty() generationStations: number;
  @ApiProperty() solarStations: number;
  @ApiProperty() distributionStations: number;
  @ApiProperty() totalGeneratorCapacity: number;
  @ApiProperty() totalSolarCapacity: number;
  @ApiPropertyOptional() totalUsers?: number;
}

export class AddUserToStationDto {
  @ApiProperty({ description: 'معرف المستخدم' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: 'دور المستخدم في المحطة' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: 'هل هي المحطة الرئيسية للمستخدم', default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class StationUserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() stationId: string;
  @ApiProperty() userId: string;
  @ApiPropertyOptional() role?: string;
  @ApiProperty() isPrimary: boolean;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional() user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
}

export class StationTreeNodeDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() nameEn?: string;
  @ApiPropertyOptional() code?: string;
  @ApiProperty({ enum: StationType }) type: StationType;
  @ApiProperty() level: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty() usersCount: number;
  @ApiProperty() entriesCount: number;
  @ApiProperty({ type: [StationTreeNodeDto] }) children: StationTreeNodeDto[];
}
