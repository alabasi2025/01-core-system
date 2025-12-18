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
import { ScheduledReportsService, CreateScheduleDto, UpdateScheduleDto } from './scheduled-reports.service';

@ApiTags('جدولة التقارير')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scheduled-reports')
export class ScheduledReportsController {
  constructor(private readonly scheduledReportsService: ScheduledReportsService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على جميع الجداول' })
  @ApiResponse({ status: 200, description: 'قائمة الجداول' })
  async findAll(@Request() req: any) {
    return this.scheduledReportsService.findAll(req.user.businessId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'الحصول على قوالب التقارير المتاحة' })
  @ApiResponse({ status: 200, description: 'قائمة القوالب' })
  async getTemplates(@Request() req: any) {
    return this.scheduledReportsService.getAvailableTemplates(req.user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على جدول محدد' })
  @ApiResponse({ status: 200, description: 'تفاصيل الجدول' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.scheduledReportsService.findOne(id, req.user.businessId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'الحصول على سجل التشغيل' })
  @ApiResponse({ status: 200, description: 'سجل التشغيل' })
  async getHistory(@Param('id') id: string, @Request() req: any) {
    return this.scheduledReportsService.getRunHistory(id, req.user.businessId);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء جدول جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الجدول' })
  async create(@Body() dto: CreateScheduleDto, @Request() req: any) {
    return this.scheduledReportsService.create(req.user.businessId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث جدول' })
  @ApiResponse({ status: 200, description: 'تم تحديث الجدول' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
    @Request() req: any,
  ) {
    return this.scheduledReportsService.update(id, req.user.businessId, dto);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'تفعيل/تعطيل جدول' })
  @ApiResponse({ status: 200, description: 'تم تغيير حالة الجدول' })
  async toggle(@Param('id') id: string, @Request() req: any) {
    return this.scheduledReportsService.toggleActive(id, req.user.businessId);
  }

  @Post(':id/run')
  @ApiOperation({ summary: 'تشغيل يدوي للجدول' })
  @ApiResponse({ status: 200, description: 'تم تشغيل التقرير' })
  async runNow(@Param('id') id: string, @Request() req: any) {
    return this.scheduledReportsService.runNow(id, req.user.businessId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف جدول' })
  @ApiResponse({ status: 200, description: 'تم حذف الجدول' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.scheduledReportsService.delete(id, req.user.businessId);
  }
}
