import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';

export interface ImportAccountDto {
  code: string;
  name: string;
  nameEn?: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  nature: 'debit' | 'credit';
  parentCode?: string;
}

export interface ImportJournalEntryDto {
  entryDate: Date;
  description: string;
  reference?: string;
  lines: {
    accountCode: string;
    description?: string;
    debit: number;
    credit: number;
  }[];
}

export interface ImportOpeningBalanceDto {
  accountCode: string;
  debit: number;
  credit: number;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: { row: number; message: string }[];
}

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * استيراد الحسابات من ملف Excel
   */
  async importAccounts(
    businessId: string,
    userId: string,
    fileBuffer: Buffer,
  ): Promise<ImportResult> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    const result: ImportResult = {
      success: true,
      totalRows: data.length,
      importedRows: 0,
      failedRows: 0,
      errors: [],
    };

    // التحقق من الأعمدة المطلوبة
    const requiredColumns = ['code', 'name', 'type', 'nature'];
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      const missingColumns = requiredColumns.filter(c => !columns.includes(c));
      if (missingColumns.length > 0) {
        throw new BadRequestException(
          `الأعمدة المطلوبة غير موجودة: ${missingColumns.join(', ')}`
        );
      }
    }

    // معالجة كل صف
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 لأن الصف الأول هو العناوين

      try {
        // التحقق من البيانات
        if (!row.code || !row.name || !row.type || !row.nature) {
          throw new Error('بيانات ناقصة');
        }

        // التحقق من صحة النوع
        const validTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
        if (!validTypes.includes(row.type)) {
          throw new Error(`نوع الحساب غير صحيح: ${row.type}`);
        }

        // التحقق من صحة الطبيعة
        if (!['debit', 'credit'].includes(row.nature)) {
          throw new Error(`طبيعة الحساب غير صحيحة: ${row.nature}`);
        }

        // التحقق من عدم وجود الحساب مسبقاً
        const existing = await this.prisma.core_accounts.findFirst({
          where: { businessId, code: String(row.code) },
        });

        if (existing) {
          throw new Error(`الحساب موجود مسبقاً: ${row.code}`);
        }

        // البحث عن الحساب الأب
        let parentId: string | null = null;
        if (row.parentCode) {
          const parent = await this.prisma.core_accounts.findFirst({
            where: { businessId, code: String(row.parentCode) },
          });
          if (!parent) {
            throw new Error(`الحساب الأب غير موجود: ${row.parentCode}`);
          }
          parentId = parent.id;
        }

        // حساب المستوى
        const level = String(row.code).length;

        // إنشاء الحساب
        await this.prisma.core_accounts.create({
          data: {
            businessId,
            code: String(row.code),
            name: row.name,
            nameEn: row.nameEn || null,
            type: row.type,
            nature: row.nature,
            parentId,
            level,
            isParent: false,
            isActive: true,
          },
        });

        result.importedRows++;
      } catch (error: any) {
        result.failedRows++;
        result.errors.push({
          row: rowNumber,
          message: error.message,
        });
      }
    }

    result.success = result.failedRows === 0;
    return result;
  }

  /**
   * استيراد القيود اليومية من ملف Excel
   */
  async importJournalEntries(
    businessId: string,
    userId: string,
    fileBuffer: Buffer,
  ): Promise<ImportResult> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    const result: ImportResult = {
      success: true,
      totalRows: data.length,
      importedRows: 0,
      failedRows: 0,
      errors: [],
    };

    // تجميع الصفوف حسب رقم القيد
    const entriesMap = new Map<string, any[]>();
    
    for (const row of data) {
      const entryNumber = row.entryNumber || row.entry_number || 'default';
      if (!entriesMap.has(entryNumber)) {
        entriesMap.set(entryNumber, []);
      }
      entriesMap.get(entryNumber)!.push(row);
    }

    let entryIndex = 0;
    for (const [entryNumber, rows] of entriesMap) {
      entryIndex++;
      
      try {
        // التحقق من توازن القيد
        let totalDebit = 0;
        let totalCredit = 0;
        const lines: any[] = [];

        for (const row of rows) {
          const debit = Number(row.debit) || 0;
          const credit = Number(row.credit) || 0;
          totalDebit += debit;
          totalCredit += credit;

          // البحث عن الحساب
          const account = await this.prisma.core_accounts.findFirst({
            where: { businessId, code: String(row.accountCode || row.account_code) },
          });

          if (!account) {
            throw new Error(`الحساب غير موجود: ${row.accountCode || row.account_code}`);
          }

          lines.push({
            accountId: account.id,
            description: row.description || null,
            debit,
            credit,
          });
        }

        // التحقق من التوازن
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new Error(`القيد غير متوازن: مدين=${totalDebit}, دائن=${totalCredit}`);
        }

        // إنشاء القيد
        const firstRow = rows[0];
        const entryDate = firstRow.entryDate || firstRow.entry_date || firstRow.date;
        
        await this.prisma.core_journal_entries.create({
          data: {
            businessId,
            entryNumber: `IMP-${Date.now()}-${entryIndex}`,
            entryDate: new Date(entryDate),
            description: firstRow.description || `قيد مستورد ${entryIndex}`,
            reference: firstRow.reference || null,
            status: 'draft',
            totalDebit,
            totalCredit,
            createdById: userId,
            lines: {
              create: lines,
            },
          },
        });

        result.importedRows++;
      } catch (error: any) {
        result.failedRows++;
        result.errors.push({
          row: entryIndex,
          message: error.message,
        });
      }
    }

    result.success = result.failedRows === 0;
    return result;
  }

  /**
   * استيراد الأرصدة الافتتاحية
   */
  async importOpeningBalances(
    businessId: string,
    userId: string,
    fileBuffer: Buffer,
    periodDate: Date,
  ): Promise<ImportResult> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    const result: ImportResult = {
      success: true,
      totalRows: data.length,
      importedRows: 0,
      failedRows: 0,
      errors: [],
    };

    // تجميع جميع الأرصدة
    const lines: any[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        const debit = Number(row.debit) || 0;
        const credit = Number(row.credit) || 0;

        if (debit === 0 && credit === 0) {
          continue; // تخطي الصفوف بدون أرصدة
        }

        // البحث عن الحساب
        const account = await this.prisma.core_accounts.findFirst({
          where: { businessId, code: String(row.accountCode || row.account_code || row.code) },
        });

        if (!account) {
          throw new Error(`الحساب غير موجود: ${row.accountCode || row.account_code || row.code}`);
        }

        lines.push({
          accountId: account.id,
          description: `رصيد افتتاحي - ${account.name}`,
          debit,
          credit,
        });

        totalDebit += debit;
        totalCredit += credit;
        result.importedRows++;
      } catch (error: any) {
        result.failedRows++;
        result.errors.push({
          row: rowNumber,
          message: error.message,
        });
      }
    }

    // إنشاء قيد الأرصدة الافتتاحية
    if (lines.length > 0) {
      // إضافة حساب الفرق إذا كان القيد غير متوازن
      const difference = totalDebit - totalCredit;
      if (Math.abs(difference) > 0.01) {
        // البحث عن حساب الأرباح المحتجزة أو إنشاء حساب فرق
        const retainedEarnings = await this.prisma.core_accounts.findFirst({
          where: { businessId, systemAccount: 'retained_earnings' },
        });

        if (retainedEarnings) {
          if (difference > 0) {
            lines.push({
              accountId: retainedEarnings.id,
              description: 'فرق الأرصدة الافتتاحية',
              debit: 0,
              credit: difference,
            });
            totalCredit += difference;
          } else {
            lines.push({
              accountId: retainedEarnings.id,
              description: 'فرق الأرصدة الافتتاحية',
              debit: Math.abs(difference),
              credit: 0,
            });
            totalDebit += Math.abs(difference);
          }
        }
      }

      await this.prisma.core_journal_entries.create({
        data: {
          businessId,
          entryNumber: `OB-${Date.now()}`,
          entryDate: periodDate,
          description: 'قيد الأرصدة الافتتاحية',
          reference: 'OPENING_BALANCE',
          status: 'draft',
          totalDebit,
          totalCredit,
          createdById: userId,
          lines: {
            create: lines,
          },
        },
      });
    }

    result.success = result.failedRows === 0;
    return result;
  }

  /**
   * تحميل قالب استيراد الحسابات
   */
  getAccountsTemplate(): Buffer {
    const template = [
      {
        code: '1111',
        name: 'الصندوق الرئيسي',
        nameEn: 'Main Cash',
        type: 'asset',
        nature: 'debit',
        parentCode: '111',
      },
      {
        code: '1112',
        name: 'البنك الأهلي',
        nameEn: 'National Bank',
        type: 'asset',
        nature: 'debit',
        parentCode: '111',
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * تحميل قالب استيراد القيود
   */
  getJournalEntriesTemplate(): Buffer {
    const template = [
      {
        entryNumber: 'JE001',
        entryDate: '2025-01-01',
        accountCode: '1111',
        description: 'إيداع نقدي',
        debit: 10000,
        credit: 0,
        reference: 'REF001',
      },
      {
        entryNumber: 'JE001',
        entryDate: '2025-01-01',
        accountCode: '31',
        description: 'رأس المال',
        debit: 0,
        credit: 10000,
        reference: 'REF001',
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Journal Entries');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * تحميل قالب استيراد الأرصدة الافتتاحية
   */
  getOpeningBalancesTemplate(): Buffer {
    const template = [
      {
        accountCode: '1111',
        accountName: 'الصندوق',
        debit: 50000,
        credit: 0,
      },
      {
        accountCode: '1112',
        accountName: 'البنك',
        debit: 100000,
        credit: 0,
      },
      {
        accountCode: '211',
        accountName: 'الموردين',
        debit: 0,
        credit: 30000,
      },
      {
        accountCode: '31',
        accountName: 'رأس المال',
        debit: 0,
        credit: 120000,
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Opening Balances');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * معاينة ملف قبل الاستيراد
   */
  async previewFile(fileBuffer: Buffer): Promise<{ columns: string[]; rows: any[]; totalRows: number }> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    const previewRows = data.slice(0, 10); // أول 10 صفوف للمعاينة

    return {
      columns,
      rows: previewRows,
      totalRows: data.length,
    };
  }
}
