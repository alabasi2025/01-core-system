import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { UpdateBusinessDto, BusinessResponseDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('المجموعات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('business')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @RequirePermissions('businesses:read')
  @ApiOperation({ summary: 'الحصول على بيانات المجموعة الحالية' })
  @ApiResponse({ status: 200, description: 'بيانات المجموعة', type: BusinessResponseDto })
  async findOne(@CurrentUser('businessId') businessId: string): Promise<BusinessResponseDto> {
    return this.businessesService.findOne(businessId);
  }

  @Put()
  @RequirePermissions('businesses:update')
  @ApiOperation({ summary: 'تحديث بيانات المجموعة' })
  @ApiResponse({ status: 200, description: 'تم تحديث المجموعة بنجاح', type: BusinessResponseDto })
  async update(
    @CurrentUser('businessId') businessId: string,
    @Body() dto: UpdateBusinessDto,
  ): Promise<BusinessResponseDto> {
    return this.businessesService.update(businessId, dto);
  }

  @Get('statistics')
  @RequirePermissions('businesses:read')
  @ApiOperation({ summary: 'الحصول على إحصائيات المجموعة' })
  @ApiResponse({ status: 200, description: 'إحصائيات المجموعة' })
  async getStatistics(@CurrentUser('businessId') businessId: string) {
    return this.businessesService.getStatistics(businessId);
  }
}
