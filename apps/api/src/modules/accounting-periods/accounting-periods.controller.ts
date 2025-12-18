import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountingPeriodsService, CreatePeriodDto, UpdatePeriodDto } from './accounting-periods.service';

@ApiTags('الفترات المحاسبية')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounting-periods')
export class AccountingPeriodsController {
  constructor(private readonly periodsService: AccountingPeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على جميع الفترات المحاسبية' })
  @ApiResponse({ status: 200, description: 'قائمة الفترات المحاسبية' })
  async findAll(@Request() req: any) {
    return this.periodsService.findAll(req.user.businessId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'الحصول على إحصائيات الفترات المحاسبية' })
  @ApiResponse({ status: 200, description: 'إحصائيات الفترات' })
  async getStatistics(@Request() req: any) {
    return this.periodsService.getStatistics(req.user.businessId);
  }

  @Get('current')
  @ApiOperation({ summary: 'الحصول على الفترة الحالية' })
  @ApiResponse({ status: 200, description: 'الفترة الحالية' })
  async getCurrentPeriod(@Request() req: any) {
    return this.periodsService.getCurrentPeriod(req.user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على تفاصيل فترة محاسبية' })
  @ApiResponse({ status: 200, description: 'تفاصيل الفترة' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.periodsService.findOne(req.user.businessId, id);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء فترة محاسبية جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الفترة بنجاح' })
  async create(@Request() req: any, @Body() dto: CreatePeriodDto) {
    return this.periodsService.create(req.user.businessId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث فترة محاسبية' })
  @ApiResponse({ status: 200, description: 'تم تحديث الفترة بنجاح' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePeriodDto,
  ) {
    return this.periodsService.update(req.user.businessId, id, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'إغلاق فترة محاسبية' })
  @ApiResponse({ status: 200, description: 'تم إغلاق الفترة بنجاح' })
  async close(@Request() req: any, @Param('id') id: string) {
    return this.periodsService.close(req.user.businessId, id, req.user.id);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'إعادة فتح فترة محاسبية' })
  @ApiResponse({ status: 200, description: 'تم إعادة فتح الفترة بنجاح' })
  async reopen(@Request() req: any, @Param('id') id: string) {
    return this.periodsService.reopen(req.user.businessId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف فترة محاسبية' })
  @ApiResponse({ status: 200, description: 'تم حذف الفترة بنجاح' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.periodsService.delete(req.user.businessId, id);
  }
}
