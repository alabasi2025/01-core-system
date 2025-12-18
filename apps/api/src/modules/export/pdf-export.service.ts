import { Injectable } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';

/**
 * خدمة تصدير التقارير إلى PDF
 * تستخدم HTML to PDF conversion
 */
@Injectable()
export class PdfExportService {
  constructor(private reportsService: ReportsService) {}

  /**
   * تصدير ميزان المراجعة إلى PDF
   */
  async exportTrialBalanceToPdf(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    const report = await this.reportsService.getTrialBalance(businessId, startDate, endDate);

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>ميزان المراجعة</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      margin: 40px;
      direction: rtl;
    }
    h1 {
      text-align: center;
      color: #1a365d;
      margin-bottom: 10px;
    }
    .period {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #4472C4;
      color: white;
      padding: 12px 8px;
      text-align: center;
      font-weight: bold;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .number {
      text-align: left;
      font-family: monospace;
    }
    .total-row {
      background-color: #E2EFDA !important;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>ميزان المراجعة</h1>
  <p class="period">من ${startDate.toLocaleDateString('ar-YE')} إلى ${endDate.toLocaleDateString('ar-YE')}</p>
  
  <table>
    <thead>
      <tr>
        <th>كود الحساب</th>
        <th>اسم الحساب</th>
        <th>مدين</th>
        <th>دائن</th>
        <th>الرصيد</th>
      </tr>
    </thead>
    <tbody>
      ${report.accounts.map(acc => `
        <tr>
          <td>${acc.code}</td>
          <td>${acc.name}</td>
          <td class="number">${this.formatNumber(acc.debit)}</td>
          <td class="number">${this.formatNumber(acc.credit)}</td>
          <td class="number">${this.formatNumber(acc.balance)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td></td>
        <td>الإجمالي</td>
        <td class="number">${this.formatNumber(report.totalDebit)}</td>
        <td class="number">${this.formatNumber(report.totalCredit)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>تم إنشاء هذا التقرير بواسطة النظام الأم - ${new Date().toLocaleString('ar-YE')}</p>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * تصدير قائمة الدخل إلى PDF
   */
  async exportIncomeStatementToPdf(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    const report = await this.reportsService.getIncomeStatement(businessId, startDate, endDate);

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>قائمة الدخل</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      margin: 40px;
      direction: rtl;
    }
    h1 {
      text-align: center;
      color: #1a365d;
      margin-bottom: 10px;
    }
    .period {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      background-color: #70AD47;
      color: white;
      padding: 10px 15px;
      font-weight: bold;
      font-size: 16px;
    }
    .section-title.expense {
      background-color: #ED7D31;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 8px 15px;
      border-bottom: 1px solid #eee;
    }
    .number {
      text-align: left;
      font-family: monospace;
      width: 150px;
    }
    .total-row {
      font-weight: bold;
      background-color: #f0f0f0;
    }
    .net-income {
      margin-top: 20px;
      padding: 15px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
    }
    .net-income.positive {
      background-color: #d4edda;
      color: #155724;
    }
    .net-income.negative {
      background-color: #f8d7da;
      color: #721c24;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>قائمة الدخل</h1>
  <p class="period">من ${startDate.toLocaleDateString('ar-YE')} إلى ${endDate.toLocaleDateString('ar-YE')}</p>
  
  <div class="section">
    <div class="section-title">الإيرادات</div>
    <table>
      ${report.revenue.accounts.map(acc => `
        <tr>
          <td>${acc.name}</td>
          <td class="number">${this.formatNumber(acc.balance)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td>إجمالي الإيرادات</td>
        <td class="number">${this.formatNumber(report.revenue.total)}</td>
      </tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title expense">المصروفات</div>
    <table>
      ${report.expenses.accounts.map(acc => `
        <tr>
          <td>${acc.name}</td>
          <td class="number">${this.formatNumber(acc.balance)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td>إجمالي المصروفات</td>
        <td class="number">${this.formatNumber(report.expenses.total)}</td>
      </tr>
    </table>
  </div>
  
  <div class="net-income ${report.netIncome >= 0 ? 'positive' : 'negative'}">
    صافي الدخل: ${this.formatNumber(report.netIncome)}
  </div>
  
  <div class="footer">
    <p>تم إنشاء هذا التقرير بواسطة النظام الأم - ${new Date().toLocaleString('ar-YE')}</p>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * تصدير الميزانية العمومية إلى PDF
   */
  async exportBalanceSheetToPdf(
    businessId: string,
    asOfDate: Date,
  ): Promise<string> {
    const report = await this.reportsService.getBalanceSheet(businessId, asOfDate);

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>الميزانية العمومية</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      margin: 40px;
      direction: rtl;
    }
    h1 {
      text-align: center;
      color: #1a365d;
      margin-bottom: 10px;
    }
    .date {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .container {
      display: flex;
      gap: 40px;
    }
    .column {
      flex: 1;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      background-color: #4472C4;
      color: white;
      padding: 10px 15px;
      font-weight: bold;
      font-size: 14px;
    }
    .section-title.liability {
      background-color: #ED7D31;
    }
    .section-title.equity {
      background-color: #70AD47;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 6px 15px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    .number {
      text-align: left;
      font-family: monospace;
    }
    .total-row {
      font-weight: bold;
      background-color: #f5f5f5;
    }
    .grand-total {
      margin-top: 20px;
      padding: 15px;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      background-color: #e8f4fd;
      border: 2px solid #4472C4;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>الميزانية العمومية</h1>
  <p class="date">كما في ${asOfDate.toLocaleDateString('ar-YE')}</p>
  
  <div class="container">
    <div class="column">
      <div class="section">
        <div class="section-title">الأصول</div>
        <table>
          ${report.assets.accounts.map(acc => `
            <tr>
              <td>${acc.name}</td>
              <td class="number">${this.formatNumber(acc.balance)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td>إجمالي الأصول</td>
            <td class="number">${this.formatNumber(report.assets.total)}</td>
          </tr>
        </table>
      </div>
    </div>
    
    <div class="column">
      <div class="section">
        <div class="section-title liability">الالتزامات</div>
        <table>
          ${report.liabilities.accounts.map(acc => `
            <tr>
              <td>${acc.name}</td>
              <td class="number">${this.formatNumber(acc.balance)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td>إجمالي الالتزامات</td>
            <td class="number">${this.formatNumber(report.liabilities.total)}</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title equity">حقوق الملكية</div>
        <table>
          ${report.equity.accounts.map(acc => `
            <tr>
              <td>${acc.name}</td>
              <td class="number">${this.formatNumber(acc.balance)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td>إجمالي حقوق الملكية</td>
            <td class="number">${this.formatNumber(report.equity.total)}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
  
  <div class="grand-total">
    إجمالي الالتزامات وحقوق الملكية: ${this.formatNumber(report.liabilities.total + report.equity.total)}
  </div>
  
  <div class="footer">
    <p>تم إنشاء هذا التقرير بواسطة النظام الأم - ${new Date().toLocaleString('ar-YE')}</p>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * تصدير تقرير أعمار الديون إلى PDF
   */
  async exportAgingReportToPdf(
    businessId: string,
    type: 'receivables' | 'payables',
    asOfDate: Date,
  ): Promise<string> {
    const report = await this.reportsService.getAgingReport(businessId, type, asOfDate);

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير أعمار ${report.typeName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      margin: 40px;
      direction: rtl;
    }
    h1 {
      text-align: center;
      color: #1a365d;
      margin-bottom: 10px;
    }
    .date {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    th {
      background-color: #4472C4;
      color: white;
      padding: 10px 6px;
      text-align: center;
      font-weight: bold;
    }
    td {
      padding: 8px 6px;
      border-bottom: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .number {
      text-align: left;
      font-family: monospace;
    }
    .total-row {
      background-color: #E2EFDA !important;
      font-weight: bold;
    }
    .summary {
      margin-top: 30px;
      display: flex;
      gap: 20px;
      justify-content: center;
    }
    .summary-box {
      padding: 15px 25px;
      border-radius: 8px;
      text-align: center;
    }
    .low-risk {
      background-color: #d4edda;
      color: #155724;
    }
    .medium-risk {
      background-color: #fff3cd;
      color: #856404;
    }
    .high-risk {
      background-color: #f8d7da;
      color: #721c24;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>تقرير أعمار ${report.typeName}</h1>
  <p class="date">حتى تاريخ ${asOfDate.toLocaleDateString('ar-YE')}</p>
  
  <table>
    <thead>
      <tr>
        <th>الحساب</th>
        <th>جاري (0-30)</th>
        <th>31-60 يوم</th>
        <th>61-90 يوم</th>
        <th>91-120 يوم</th>
        <th>+120 يوم</th>
        <th>الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${report.details.map(item => `
        <tr>
          <td>${item.accountCode} - ${item.accountName}</td>
          <td class="number">${this.formatNumber(item.current)}</td>
          <td class="number">${this.formatNumber(item.days31_60)}</td>
          <td class="number">${this.formatNumber(item.days61_90)}</td>
          <td class="number">${this.formatNumber(item.days91_120)}</td>
          <td class="number">${this.formatNumber(item.over120)}</td>
          <td class="number">${this.formatNumber(item.totalBalance)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td>الإجمالي</td>
        <td class="number">${this.formatNumber(report.summary.current)}</td>
        <td class="number">${this.formatNumber(report.summary.days31_60)}</td>
        <td class="number">${this.formatNumber(report.summary.days61_90)}</td>
        <td class="number">${this.formatNumber(report.summary.days91_120)}</td>
        <td class="number">${this.formatNumber(report.summary.over120)}</td>
        <td class="number">${this.formatNumber(report.summary.grandTotal)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="summary">
    <div class="summary-box low-risk">
      <div>مخاطر منخفضة</div>
      <div style="font-size: 20px; font-weight: bold;">${this.formatNumber(report.riskAnalysis.lowRisk)}</div>
    </div>
    <div class="summary-box medium-risk">
      <div>مخاطر متوسطة</div>
      <div style="font-size: 20px; font-weight: bold;">${this.formatNumber(report.riskAnalysis.mediumRisk)}</div>
    </div>
    <div class="summary-box high-risk">
      <div>مخاطر عالية</div>
      <div style="font-size: 20px; font-weight: bold;">${this.formatNumber(report.riskAnalysis.highRisk)}</div>
    </div>
  </div>
  
  <div class="footer">
    <p>تم إنشاء هذا التقرير بواسطة النظام الأم - ${new Date().toLocaleString('ar-YE')}</p>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * تنسيق الأرقام
   */
  private formatNumber(num: number): string {
    return new Intl.NumberFormat('ar-YE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);
  }
}
