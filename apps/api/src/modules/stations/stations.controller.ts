import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StationsService } from './stations.service';
import { CreateStationDto, UpdateStationDto, StationQueryDto, StationResponseDto, PaginatedStationsDto, StationStatisticsDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('المحطات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  @RequirePermissions('stations:create')
  @ApiOperation({ summary: 'إنشاء محطة جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء المحطة بنجاح', type: StationResponseDto })
  @ApiResponse({ status: 409, description: 'اسم المحطة مستخدم بالفعل' })
  async create(
    @CurrentUser('businessId') businessId: string,
    @Body() dto: CreateStationDto,
  ): Promise<StationResponseDto> {
    return this.stationsService.create(businessId, dto);
  }

  @Get()
  @RequirePermissions('stations:read')
  @ApiOperation({ summary: 'الحصول على قائمة المحطات' })
  @ApiResponse({ status: 200, description: 'قائمة المحطات', type: PaginatedStationsDto })
  async findAll(
    @CurrentUser('businessId') businessId: string,
    @Query() query: StationQueryDto,
  ): Promise<PaginatedStationsDto> {
    return this.stationsService.findAll(businessId, query);
  }

  @Get('statistics')
  @RequirePermissions('stations:read')
  @ApiOperation({ summary: 'الحصول على إحصائيات المحطات' })
  @ApiResponse({ status: 200, description: 'إحصائيات المحطات', type: StationStatisticsDto })
  async getStatistics(
    @CurrentUser('businessId') businessId: string,
  ): Promise<StationStatisticsDto> {
    return this.stationsService.getStatistics(businessId);
  }

  @Get('my-stations')
  @ApiOperation({ summary: 'الحصول على المحطات المتاحة للمستخدم الحالي' })
  @ApiResponse({ status: 200, description: 'المحطات المتاحة', type: [StationResponseDto] })
  async getMyStations(@CurrentUser() user: CurrentUserData): Promise<StationResponseDto[]> {
    return this.stationsService.getStationsForUser(user.businessId, user.scopeType, user.scopeIds);
  }

  @Get(':id')
  @RequirePermissions('stations:read')
  @ApiOperation({ summary: 'الحصول على بيانات محطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'بيانات المحطة', type: StationResponseDto })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  async findOne(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
  ): Promise<StationResponseDto> {
    return this.stationsService.findOne(businessId, id);
  }

  @Put(':id')
  @RequirePermissions('stations:update')
  @ApiOperation({ summary: 'تحديث بيانات محطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'تم تحديث المحطة بنجاح', type: StationResponseDto })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  async update(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStationDto,
  ): Promise<StationResponseDto> {
    return this.stationsService.update(businessId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('stations:delete')
  @ApiOperation({ summary: 'حذف محطة' })
  @ApiParam({ name: 'id', description: 'معرف المحطة' })
  @ApiResponse({ status: 200, description: 'تم حذف المحطة بنجاح' })
  @ApiResponse({ status: 404, description: 'المحطة غير موجودة' })
  @ApiResponse({ status: 409, description: 'لا يمكن حذف المحطة لارتباطها ببيانات أخرى' })
  async remove(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.stationsService.remove(businessId, id);
  }
}
