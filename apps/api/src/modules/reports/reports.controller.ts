import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * ميزان المراجعة
   * GET /api/v1/reports/trial-balance?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('trial-balance')
  async getTrialBalance(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.validateDateRange(startDate, endDate);

    return this.reportsService.getTrialBalance(
      req.user.businessId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * قائمة الدخل
   * GET /api/v1/reports/income-statement?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('income-statement')
  async getIncomeStatement(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.validateDateRange(startDate, endDate);

    return this.reportsService.getIncomeStatement(
      req.user.businessId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * الميزانية العمومية
   * GET /api/v1/reports/balance-sheet?asOfDate=2024-12-31
   */
  @Get('balance-sheet')
  async getBalanceSheet(
    @Request() req,
    @Query('asOfDate') asOfDate: string,
  ) {
    if (!asOfDate) {
      throw new BadRequestException('يجب تحديد التاريخ');
    }

    return this.reportsService.getBalanceSheet(
      req.user.businessId,
      new Date(asOfDate),
    );
  }

  /**
   * دفتر الأستاذ
   * GET /api/v1/reports/general-ledger/:accountId?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('general-ledger/:accountId')
  async getGeneralLedger(
    @Request() req,
    @Param('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.validateDateRange(startDate, endDate);

    return this.reportsService.getGeneralLedger(
      req.user.businessId,
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * دفتر اليومية
   * GET /api/v1/reports/journal-book?startDate=2024-01-01&endDate=2024-12-31&page=1&limit=50
   */
  @Get('journal-book')
  async getJournalBook(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    this.validateDateRange(startDate, endDate);

    return this.reportsService.getJournalBook(
      req.user.businessId,
      new Date(startDate),
      new Date(endDate),
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * كشف حساب
   * GET /api/v1/reports/account-statement/:accountId?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('account-statement/:accountId')
  async getAccountStatement(
    @Request() req,
    @Param('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.validateDateRange(startDate, endDate);

    return this.reportsService.getAccountStatement(
      req.user.businessId,
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * تقرير التدفقات النقدية
   * GET /api/v1/reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('cash-flow')
  async getCashFlowStatement(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.validateDateRange(startDate, endDate);

    return this.reportsService.getCashFlowStatement(
      req.user.businessId,
      new Date(startDate),
      new Date(endDate),
    );
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
