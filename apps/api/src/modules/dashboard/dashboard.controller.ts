import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('لوحة التحكم')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على إحصائيات لوحة التحكم الكاملة' })
  @ApiResponse({ status: 200, description: 'إحصائيات لوحة التحكم' })
  async getDashboardStatistics(@Request() req: any) {
    return this.dashboardService.getDashboardStatistics(req.user.businessId);
  }

  @Get('financial-summary')
  @ApiOperation({ summary: 'الحصول على الملخص المالي' })
  @ApiResponse({ status: 200, description: 'الملخص المالي' })
  async getFinancialSummary(@Request() req: any) {
    return this.dashboardService.getFinancialSummary(req.user.businessId);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'الحصول على بيانات رسم الإيرادات' })
  @ApiResponse({ status: 200, description: 'بيانات الرسم البياني' })
  async getRevenueChart(
    @Request() req: any,
    @Query('months') months?: number,
  ) {
    return this.dashboardService.getRevenueChart(req.user.businessId, months || 6);
  }

  @Get('collection-stats')
  @ApiOperation({ summary: 'الحصول على إحصائيات التحصيل' })
  @ApiResponse({ status: 200, description: 'إحصائيات التحصيل' })
  async getCollectionStats(@Request() req: any) {
    return this.dashboardService.getCollectionStats(req.user.businessId);
  }

  @Get('pending-reconciliations')
  @ApiOperation({ summary: 'الحصول على التسويات المعلقة' })
  @ApiResponse({ status: 200, description: 'قائمة التسويات المعلقة' })
  async getPendingReconciliations(@Request() req: any) {
    return this.dashboardService.getPendingReconciliations(req.user.businessId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'الحصول على التنبيهات' })
  @ApiResponse({ status: 200, description: 'قائمة التنبيهات' })
  async getAlerts(@Request() req: any) {
    return this.dashboardService.getAlerts(req.user.businessId);
  }

  @Get('recent-transactions')
  @ApiOperation({ summary: 'الحصول على آخر المعاملات' })
  @ApiResponse({ status: 200, description: 'قائمة آخر المعاملات' })
  async getRecentTransactions(
    @Request() req: any,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getRecentTransactions(req.user.businessId, limit || 10);
  }

  @Get('payment-orders-stats')
  @ApiOperation({ summary: 'الحصول على إحصائيات أوامر الدفع' })
  @ApiResponse({ status: 200, description: 'إحصائيات أوامر الدفع' })
  async getPaymentOrdersStats(@Request() req: any) {
    return this.dashboardService.getPaymentOrdersStats(req.user.businessId);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'الحصول على مؤشرات الأداء الرئيسية (KPIs)' })
  @ApiResponse({ status: 200, description: 'مؤشرات الأداء' })
  async getKPIs(@Request() req: any) {
    return this.dashboardService.getKPIs(req.user.businessId);
  }

  @Get('charts/collections-by-method')
  @ApiOperation({ summary: 'رسم بياني للتحصيلات حسب طريقة الدفع' })
  @ApiResponse({ status: 200, description: 'بيانات الرسم البياني' })
  async getCollectionsByPaymentMethodChart(
    @Request() req: any,
    @Query('months') months?: number,
  ) {
    return this.dashboardService.getCollectionsByPaymentMethodChart(req.user.businessId, months || 6);
  }

  @Get('charts/collector-performance')
  @ApiOperation({ summary: 'رسم بياني لأداء المتحصلين' })
  @ApiResponse({ status: 200, description: 'بيانات الرسم البياني' })
  async getCollectorPerformanceChart(
    @Request() req: any,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getCollectorPerformanceChart(req.user.businessId, limit || 10);
  }

  @Get('charts/expenses-by-category')
  @ApiOperation({ summary: 'رسم بياني للمصروفات حسب الفئة' })
  @ApiResponse({ status: 200, description: 'بيانات الرسم البياني' })
  async getExpensesByCategoryChart(
    @Request() req: any,
    @Query('months') months?: number,
  ) {
    return this.dashboardService.getExpensesByCategoryChart(req.user.businessId, months || 3);
  }

  @Get('advanced')
  @ApiOperation({ summary: 'الحصول على لوحة التحكم المتقدمة الشاملة' })
  @ApiResponse({ status: 200, description: 'بيانات لوحة التحكم المتقدمة' })
  async getAdvancedDashboard(@Request() req: any) {
    return this.dashboardService.getAdvancedDashboard(req.user.businessId);
  }
}
