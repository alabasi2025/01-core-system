import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private reportsService: ReportsService,
  ) {}

  /**
   * تصدير ميزان المراجعة إلى Excel
   */
  async exportTrialBalanceToExcel(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    const report = await this.reportsService.getTrialBalance(businessId, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'النظام المحاسبي';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('ميزان المراجعة', {
      views: [{ rightToLeft: true }],
    });

    // العنوان
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ميزان المراجعة';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // الفترة
    worksheet.mergeCells('A2:E2');
    const periodCell = worksheet.getCell('A2');
    periodCell.value = `من ${startDate.toLocaleDateString('ar-YE')} إلى ${endDate.toLocaleDateString('ar-YE')}`;
    periodCell.alignment = { horizontal: 'center' };

    // رؤوس الأعمدة
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['كود الحساب', 'اسم الحساب', 'مدين', 'دائن', 'الرصيد']);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // البيانات
    for (const account of report.accounts) {
      const row = worksheet.addRow([
        account.code,
        account.name,
        account.debit,
        account.credit,
        account.balance,
      ]);
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (colNumber >= 3) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });
    }

    // صف الإجمالي
    const totalRow = worksheet.addRow([
      '',
      'الإجمالي',
      report.totalDebit,
      report.totalCredit,
      '',
    ]);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      if (colNumber >= 3) {
        cell.numFmt = '#,##0.00';
      }
    });

    // تعديل عرض الأعمدة
    worksheet.columns = [
      { width: 15 },
      { width: 40 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * تصدير قائمة الدخل إلى Excel
   */
  async exportIncomeStatementToExcel(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    const report = await this.reportsService.getIncomeStatement(businessId, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('قائمة الدخل', {
      views: [{ rightToLeft: true }],
    });

    // العنوان
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'قائمة الدخل';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:C2');
    worksheet.getCell('A2').value = `من ${startDate.toLocaleDateString('ar-YE')} إلى ${endDate.toLocaleDateString('ar-YE')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // قسم الإيرادات
    const revenueHeader = worksheet.addRow(['الإيرادات', '', '']);
    revenueHeader.font = { bold: true, size: 14 };
    revenueHeader.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };

    for (const account of report.revenue.accounts) {
      const row = worksheet.addRow([account.name, '', account.balance]);
      row.getCell(3).numFmt = '#,##0.00';
    }

    const revenueTotalRow = worksheet.addRow(['إجمالي الإيرادات', '', report.revenue.total]);
    revenueTotalRow.font = { bold: true };
    revenueTotalRow.getCell(3).numFmt = '#,##0.00';

    worksheet.addRow([]);

    // قسم المصروفات
    const expenseHeader = worksheet.addRow(['المصروفات', '', '']);
    expenseHeader.font = { bold: true, size: 14 };
    expenseHeader.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFED7D31' },
    };

    for (const account of report.expenses.accounts) {
      const row = worksheet.addRow([account.name, '', account.balance]);
      row.getCell(3).numFmt = '#,##0.00';
    }

    const expenseTotalRow = worksheet.addRow(['إجمالي المصروفات', '', report.expenses.total]);
    expenseTotalRow.font = { bold: true };
    expenseTotalRow.getCell(3).numFmt = '#,##0.00';

    worksheet.addRow([]);

    // صافي الدخل
    const netIncomeRow = worksheet.addRow(['صافي الدخل', '', report.netIncome]);
    netIncomeRow.font = { bold: true, size: 14 };
    netIncomeRow.getCell(3).numFmt = '#,##0.00';
    netIncomeRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: report.netIncome >= 0 ? 'FF70AD47' : 'FFFF0000' },
    };

    worksheet.columns = [
      { width: 40 },
      { width: 15 },
      { width: 20 },
    ];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * تصدير دفتر اليومية إلى Excel
   */
  async exportJournalBookToExcel(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    const report = await this.reportsService.getJournalBook(businessId, startDate, endDate, 1, 10000);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('دفتر اليومية', {
      views: [{ rightToLeft: true }],
    });

    // العنوان
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'دفتر اليومية';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `من ${startDate.toLocaleDateString('ar-YE')} إلى ${endDate.toLocaleDateString('ar-YE')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // رؤوس الأعمدة
    const headerRow = worksheet.addRow(['رقم القيد', 'التاريخ', 'الحساب', 'البيان', 'مدين', 'دائن']);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // البيانات
    for (const entry of report.entries) {
      // صف القيد الرئيسي
      worksheet.addRow([
        entry.entryNumber,
        new Date(entry.entryDate).toLocaleDateString('ar-YE'),
        '',
        entry.description,
        '',
        '',
      ]).font = { bold: true };

      // سطور القيد
      for (const line of entry.lines) {
        const row = worksheet.addRow([
          '',
          '',
          `${line.accountCode} - ${line.accountName}`,
          line.description || '',
          line.debit || '',
          line.credit || '',
        ]);
        row.getCell(5).numFmt = '#,##0.00';
        row.getCell(6).numFmt = '#,##0.00';
      }
    }

    worksheet.columns = [
      { width: 15 },
      { width: 12 },
      { width: 35 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
    ];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * تصدير تقرير أعمار الديون إلى Excel
   */
  async exportAgingReportToExcel(
    businessId: string,
    type: 'receivables' | 'payables',
    asOfDate: Date,
  ): Promise<Buffer> {
    const report = await this.reportsService.getAgingReport(businessId, type, asOfDate);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`تقرير أعمار ${report.typeName}`, {
      views: [{ rightToLeft: true }],
    });

    // العنوان
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = `تقرير أعمار ${report.typeName}`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `حتى تاريخ ${asOfDate.toLocaleDateString('ar-YE')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // رؤوس الأعمدة
    const headerRow = worksheet.addRow([
      'الحساب',
      'جاري (0-30)',
      '31-60 يوم',
      '61-90 يوم',
      '91-120 يوم',
      'أكثر من 120',
      'الإجمالي',
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // البيانات
    for (const item of report.details) {
      const row = worksheet.addRow([
        `${item.accountCode} - ${item.accountName}`,
        item.current,
        item.days31_60,
        item.days61_90,
        item.days91_120,
        item.over120,
        item.totalBalance,
      ]);
      for (let i = 2; i <= 7; i++) {
        row.getCell(i).numFmt = '#,##0.00';
        row.getCell(i).alignment = { horizontal: 'right' };
      }
    }

    // صف الإجمالي
    const totalRow = worksheet.addRow([
      'الإجمالي',
      report.summary.current,
      report.summary.days31_60,
      report.summary.days61_90,
      report.summary.days91_120,
      report.summary.over120,
      report.summary.grandTotal,
    ]);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' },
      };
      if (colNumber >= 2) {
        cell.numFmt = '#,##0.00';
      }
    });

    worksheet.columns = [
      { width: 40 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 18 },
    ];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * تصدير تقرير التحصيلات إلى Excel
   */
  async exportCollectionsReportToExcel(
    businessId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' | 'collector' | 'cashBox' = 'day',
  ): Promise<Buffer> {
    const report = await this.reportsService.getCollectionsReport(businessId, startDate, endDate, groupBy);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير التحصيلات', {
      views: [{ rightToLeft: true }],
    });

    // العنوان
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'تقرير التحصيلات';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `من ${startDate.toLocaleDateString('ar-YE')} إلى ${endDate.toLocaleDateString('ar-YE')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // رؤوس الأعمدة
    const headerRow = worksheet.addRow(['الفترة/المتحصل', 'نقدي', 'بطاقة', 'تحويل', 'شيك', 'الإجمالي', 'العدد']);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // البيانات
    for (const item of report.data) {
      const row = worksheet.addRow([
        item.label,
        item.cash,
        item.card,
        item.transfer,
        item.check,
        item.total,
        item.count,
      ]);
      for (let i = 2; i <= 6; i++) {
        row.getCell(i).numFmt = '#,##0.00';
      }
    }

    // صف الإجمالي
    const totalRow = worksheet.addRow([
      'الإجمالي',
      report.totals.cash,
      report.totals.card,
      report.totals.transfer,
      report.totals.check,
      report.totals.total,
      report.totals.count,
    ]);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' },
      };
      if (colNumber >= 2 && colNumber <= 6) {
        cell.numFmt = '#,##0.00';
      }
    });

    worksheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 18 },
      { width: 10 },
    ];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * تصدير القيود اليومية إلى Excel
   */
  async exportJournalEntriesToExcel(
    businessId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
    },
  ): Promise<Buffer> {
    const entries = await this.prisma.core_journal_entries.findMany({
      where: {
        businessId,
        ...(filters.startDate && filters.endDate && {
          entryDate: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
        ...(filters.status && { status: filters.status }),
        deletedAt: null,
      },
      include: {
        lines: {
          include: {
            account: {
              select: { code: true, name: true },
            },
          },
        },
        creator: {
          select: { name: true },
        },
      },
      orderBy: { entryDate: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('القيود اليومية', {
      views: [{ rightToLeft: true }],
    });

    // العنوان
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'القيود اليومية';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // رؤوس الأعمدة
    const headerRow = worksheet.addRow([
      'رقم القيد',
      'التاريخ',
      'البيان',
      'الحالة',
      'إجمالي مدين',
      'إجمالي دائن',
      'المرجع',
      'المنشئ',
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    // البيانات
    const statusLabels: { [key: string]: string } = {
      draft: 'مسودة',
      posted: 'مرحل',
      voided: 'ملغي',
    };

    for (const entry of entries) {
      const row = worksheet.addRow([
        entry.entryNumber,
        new Date(entry.entryDate).toLocaleDateString('ar-YE'),
        entry.description,
        statusLabels[entry.status] || entry.status,
        Number(entry.totalDebit),
        Number(entry.totalCredit),
        entry.referenceNumber || '',
        entry.creator.name,
      ]);
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(6).numFmt = '#,##0.00';
    }

    worksheet.columns = [
      { width: 15 },
      { width: 12 },
      { width: 35 },
      { width: 10 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
    ];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
