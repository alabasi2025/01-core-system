import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

interface AccountBalance {
  accountId: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  level: number;
  debit: number;
  credit: number;
  balance: number;
}

interface TrialBalanceReport {
  periodStart: Date;
  periodEnd: Date;
  accounts: AccountBalance[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

interface IncomeStatementReport {
  periodStart: Date;
  periodEnd: Date;
  revenue: { total: number; accounts: AccountBalance[] };
  expenses: { total: number; accounts: AccountBalance[] };
  netIncome: number;
}

interface BalanceSheetReport {
  asOfDate: Date;
  assets: { total: number; accounts: AccountBalance[] };
  liabilities: { total: number; accounts: AccountBalance[] };
  equity: { total: number; accounts: AccountBalance[] };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

interface GeneralLedgerEntry {
  date: Date;
  entryNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface GeneralLedgerReport {
  account: { id: string; code: string; name: string };
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  entries: GeneralLedgerEntry[];
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * ميزان المراجعة (Trial Balance)
   */
  async getTrialBalance(
    businessId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<TrialBalanceReport> {
    // جلب جميع الحسابات الفرعية (غير الأب)
    const accounts = await this.prisma.core_accounts.findMany({
      where: {
        businessId,
        isParent: false,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { code: 'asc' },
    });

    // جلب جميع سطور القيود المرحلة في الفترة
    const journalLines = await this.prisma.core_journal_entry_lines.findMany({
      where: {
        journalEntry: {
          businessId,
          status: 'posted',
          entryDate: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      },
      include: {
        journalEntry: true,
      },
    });

    // حساب الأرصدة لكل حساب
    const accountBalances: AccountBalance[] = accounts.map((account) => {
      const accountLines = journalLines.filter(
        (line) => line.accountId === account.id,
      );

      const totalDebit = accountLines.reduce(
        (sum, line) => sum + Number(line.debit),
        0,
      );
      const totalCredit = accountLines.reduce(
        (sum, line) => sum + Number(line.credit),
        0,
      );

      // حساب الرصيد حسب طبيعة الحساب
      let balance: number;
      if (account.nature === 'debit') {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        level: account.level,
        debit: totalDebit,
        credit: totalCredit,
        balance: Math.abs(balance),
      };
    });

    // فلترة الحسابات التي لها حركة
    const activeAccounts = accountBalances.filter(
      (acc) => acc.debit > 0 || acc.credit > 0,
    );

    const totalDebit = activeAccounts.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = activeAccounts.reduce((sum, acc) => sum + acc.credit, 0);

    return {
      periodStart,
      periodEnd,
      accounts: activeAccounts,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  /**
   * قائمة الدخل (Income Statement)
   */
  async getIncomeStatement(
    businessId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<IncomeStatementReport> {
    // جلب حسابات الإيرادات والمصروفات
    const revenueAccounts = await this.prisma.core_accounts.findMany({
      where: {
        businessId,
        type: 'revenue',
        isParent: false,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { code: 'asc' },
    });

    const expenseAccounts = await this.prisma.core_accounts.findMany({
      where: {
        businessId,
        type: 'expense',
        isParent: false,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { code: 'asc' },
    });

    // جلب سطور القيود
    const journalLines = await this.prisma.core_journal_entry_lines.findMany({
      where: {
        journalEntry: {
          businessId,
          status: 'posted',
          entryDate: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        accountId: {
          in: [...revenueAccounts, ...expenseAccounts].map((a) => a.id),
        },
      },
    });

    // حساب أرصدة الإيرادات
    const revenueBalances: AccountBalance[] = revenueAccounts.map((account) => {
      const accountLines = journalLines.filter(
        (line) => line.accountId === account.id,
      );
      const totalDebit = accountLines.reduce(
        (sum, line) => sum + Number(line.debit),
        0,
      );
      const totalCredit = accountLines.reduce(
        (sum, line) => sum + Number(line.credit),
        0,
      );
      const balance = totalCredit - totalDebit; // الإيرادات دائنة

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        level: account.level,
        debit: totalDebit,
        credit: totalCredit,
        balance,
      };
    });

    // حساب أرصدة المصروفات
    const expenseBalances: AccountBalance[] = expenseAccounts.map((account) => {
      const accountLines = journalLines.filter(
        (line) => line.accountId === account.id,
      );
      const totalDebit = accountLines.reduce(
        (sum, line) => sum + Number(line.debit),
        0,
      );
      const totalCredit = accountLines.reduce(
        (sum, line) => sum + Number(line.credit),
        0,
      );
      const balance = totalDebit - totalCredit; // المصروفات مدينة

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        level: account.level,
        debit: totalDebit,
        credit: totalCredit,
        balance,
      };
    });

    const totalRevenue = revenueBalances
      .filter((a) => a.balance > 0)
      .reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenseBalances
      .filter((a) => a.balance > 0)
      .reduce((sum, acc) => sum + acc.balance, 0);

    return {
      periodStart,
      periodEnd,
      revenue: {
        total: totalRevenue,
        accounts: revenueBalances.filter((a) => a.balance !== 0),
      },
      expenses: {
        total: totalExpenses,
        accounts: expenseBalances.filter((a) => a.balance !== 0),
      },
      netIncome: totalRevenue - totalExpenses,
    };
  }

  /**
   * الميزانية العمومية (Balance Sheet)
   */
  async getBalanceSheet(
    businessId: string,
    asOfDate: Date,
  ): Promise<BalanceSheetReport> {
    // جلب جميع الحسابات
    const accounts = await this.prisma.core_accounts.findMany({
      where: {
        businessId,
        isParent: false,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { code: 'asc' },
    });

    // جلب جميع سطور القيود حتى تاريخ معين
    const journalLines = await this.prisma.core_journal_entry_lines.findMany({
      where: {
        journalEntry: {
          businessId,
          status: 'posted',
          entryDate: {
            lte: asOfDate,
          },
        },
      },
    });

    // حساب الأرصدة لكل حساب
    const calculateBalance = (accountId: string, nature: string): number => {
      const accountLines = journalLines.filter(
        (line) => line.accountId === accountId,
      );
      const totalDebit = accountLines.reduce(
        (sum, line) => sum + Number(line.debit),
        0,
      );
      const totalCredit = accountLines.reduce(
        (sum, line) => sum + Number(line.credit),
        0,
      );

      if (nature === 'debit') {
        return totalDebit - totalCredit;
      } else {
        return totalCredit - totalDebit;
      }
    };

    // تصنيف الحسابات
    const assetAccounts = accounts.filter((a) => a.type === 'asset');
    const liabilityAccounts = accounts.filter((a) => a.type === 'liability');
    const equityAccounts = accounts.filter((a) => a.type === 'equity');

    const assetBalances: AccountBalance[] = assetAccounts.map((account) => ({
      accountId: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      nature: account.nature,
      level: account.level,
      debit: 0,
      credit: 0,
      balance: calculateBalance(account.id, account.nature),
    }));

    const liabilityBalances: AccountBalance[] = liabilityAccounts.map(
      (account) => ({
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        level: account.level,
        debit: 0,
        credit: 0,
        balance: calculateBalance(account.id, account.nature),
      }),
    );

    const equityBalances: AccountBalance[] = equityAccounts.map((account) => ({
      accountId: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      nature: account.nature,
      level: account.level,
      debit: 0,
      credit: 0,
      balance: calculateBalance(account.id, account.nature),
    }));

    const totalAssets = assetBalances.reduce(
      (sum, acc) => sum + acc.balance,
      0,
    );
    const totalLiabilities = liabilityBalances.reduce(
      (sum, acc) => sum + acc.balance,
      0,
    );
    const totalEquity = equityBalances.reduce(
      (sum, acc) => sum + acc.balance,
      0,
    );

    return {
      asOfDate,
      assets: {
        total: totalAssets,
        accounts: assetBalances.filter((a) => a.balance !== 0),
      },
      liabilities: {
        total: totalLiabilities,
        accounts: liabilityBalances.filter((a) => a.balance !== 0),
      },
      equity: {
        total: totalEquity,
        accounts: equityBalances.filter((a) => a.balance !== 0),
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  /**
   * دفتر الأستاذ (General Ledger)
   */
  async getGeneralLedger(
    businessId: string,
    accountId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<GeneralLedgerReport> {
    // جلب الحساب
    const account = await this.prisma.core_accounts.findFirst({
      where: { id: accountId, businessId },
    });

    if (!account) {
      throw new NotFoundException('الحساب غير موجود');
    }

    // جلب الرصيد الافتتاحي (جميع القيود قبل تاريخ البداية)
    const openingLines = await this.prisma.core_journal_entry_lines.findMany({
      where: {
        accountId,
        journalEntry: {
          businessId,
          status: 'posted',
          entryDate: {
            lt: periodStart,
          },
        },
      },
    });

    const openingDebit = openingLines.reduce(
      (sum, line) => sum + Number(line.debit),
      0,
    );
    const openingCredit = openingLines.reduce(
      (sum, line) => sum + Number(line.credit),
      0,
    );
    let openingBalance =
      account.nature === 'debit'
        ? openingDebit - openingCredit
        : openingCredit - openingDebit;

    // جلب حركات الفترة
    const periodLines = await this.prisma.core_journal_entry_lines.findMany({
      where: {
        accountId,
        journalEntry: {
          businessId,
          status: 'posted',
          entryDate: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      },
      include: {
        journalEntry: true,
      },
      orderBy: {
        journalEntry: {
          entryDate: 'asc',
        },
      },
    });

    // بناء سجل الحركات
    let runningBalance = openingBalance;
    const entries: GeneralLedgerEntry[] = periodLines.map((line) => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);

      if (account.nature === 'debit') {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        date: line.journalEntry.entryDate,
        entryNumber: line.journalEntry.entryNumber,
        description: line.description || line.journalEntry.description || '',
        debit,
        credit,
        balance: runningBalance,
      };
    });

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
      },
      periodStart,
      periodEnd,
      openingBalance,
      entries,
      closingBalance: runningBalance,
      totalDebit,
      totalCredit,
    };
  }

  /**
   * دفتر اليومية (Journal Book)
   */
  async getJournalBook(
    businessId: string,
    periodStart: Date,
    periodEnd: Date,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.core_journal_entries.findMany({
        where: {
          businessId,
          status: 'posted',
          entryDate: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
          creator: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ entryDate: 'asc' }, { entryNumber: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.core_journal_entries.count({
        where: {
          businessId,
          status: 'posted',
          entryDate: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      }),
    ]);

    return {
      periodStart,
      periodEnd,
      entries: entries.map((entry) => ({
        id: entry.id,
        entryNumber: entry.entryNumber,
        entryDate: entry.entryDate,
        description: entry.description,
        totalDebit: Number(entry.totalDebit),
        totalCredit: Number(entry.totalCredit),
        createdBy: entry.creator.name,
        lines: entry.lines.map((line) => ({
          accountCode: line.account.code,
          accountName: line.account.name,
          description: line.description,
          debit: Number(line.debit),
          credit: Number(line.credit),
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * كشف حساب (Account Statement)
   */
  async getAccountStatement(
    businessId: string,
    accountId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    return this.getGeneralLedger(businessId, accountId, periodStart, periodEnd);
  }
}
