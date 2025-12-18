import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExportService } from './export.service';

@ApiTags('تصدير البيانات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * تصدير ميزان المراجعة إلى Excel
   */
  @Get('trial-balance/excel')
  @ApiOperation({ summary: 'تصدير ميزان المراجعة إلى Excel' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async exportTrialBalanceToExcel(
    @Request() req,
    @Res() res: Response,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.validateDateRange(startDate, endDate);

    const buffer = await this.exportService.exportTrialBalanceToExcel(
      req.user.businessId,
      new Date(startDate),
      new Date(endDate),
    );

    const filename = `trial-balance-${startDate}-${endDate}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * تصدير قائمة الدخل إلى Excel
   */
  @Get('income-statement/excel')
  @ApiOperation({ summary: 'تصدير قائمة الدخل إلى Excel' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async exportIncomeStatementToExcel(
    @Request() req,
    @Res() res: Response,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.validateDateRange(startDate, endDate);

    const buffer = await this.exportService.exportIncomeStatementToExcel(
      req.user.businessId,
      new Date(startDate),
      new Date(endDate),
    );

    const filename = `income-statement-${startDate}-${endDate}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * تصدير دفتر اليومية إلى Excel
   */
  @Get('journal-book/excel')
  @ApiOperation({ summary: 'تصدير دفتر اليومية إلى Excel' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async exportJournalBookToExcel(
    @Request() req,
    @Res() res: Response,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.validateDateRange(startDate, endDate);

    const buffer = await this.exportService.exportJournalBookToExcel(
      req.user.businessId,
      new Date(startDate),
      new Date(endDate),
    );

    const filename = `journal-book-${startDate}-${endDate}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * تصدير تقرير أعمار الديون إلى Excel
   */
  @Get('aging/excel')
  @ApiOperation({ summary: 'تصدير تقرير أعمار الديون إلى Excel' })
  @ApiQuery({ name: 'type', required: false, enum: ['receivables', 'payables'] })
  @ApiQuery({ name: 'asOfDate', required: true, type: String })
  async exportAgingReportToExcel(
    @Request() req,
    @Res() res: Response,
    @Query('type') type: 'receivables' | 'payables' = 'receivables',
    @Query('asOfDate') asOfDate: string,
  ) {
    if (!asOfDate) {
      throw new BadRequestException('يجب تحديد التاريخ');
    }

    const buffer = await this.exportService.exportAgingReportToExcel(
      req.user.businessId,
      type,
      new Date(asOfDate),
    );

    const filename = `aging-${type}-${asOfDate}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * تصدير تقرير التحصيلات إلى Excel
   */
  @Get('collections/excel')
  @ApiOperation({ summary: 'تصدير تقرير التحصيلات إلى Excel' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month', 'collector', 'cashBox'] })
  async exportCollectionsReportToExcel(
    @Request() req,
    @Res() res: Response,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' | 'collector' | 'cashBox' = 'day',
  ) {
    this.validateDateRange(startDate, endDate);

    const buffer = await this.exportService.exportCollectionsReportToExcel(
      req.user.businessId,
      new Date(startDate),
      new Date(endDate),
      groupBy,
    );

    const filename = `collections-${groupBy}-${startDate}-${endDate}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * تصدير القيود اليومية إلى Excel
   */
  @Get('journal-entries/excel')
  @ApiOperation({ summary: 'تصدير القيود اليومية إلى Excel' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'posted', 'voided'] })
  async exportJournalEntriesToExcel(
    @Request() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    const buffer = await this.exportService.exportJournalEntriesToExcel(
      req.user.businessId,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
      },
    );

    const filename = `journal-entries-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * التحقق من صحة نطاق التاريخ
   */
  private validateDateRange(startDate: string, endDate: string): void {
    if (!startDate || !endDate) {
      throw new BadRequestException('يجب تحديد تاريخ البداية والنهاية');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('تنسيق التاريخ غير صحيح');
    }

    if (start > end) {
      throw new BadRequestException('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
    }
  }
}
