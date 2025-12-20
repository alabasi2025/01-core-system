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
    const openingBalance =
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
    page = 1,
    limit = 50,
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

  /**
   * تقرير التدفقات النقدية (Cash Flow Statement)
   */
  async getCashFlowStatement(
    businessId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    // جلب حسابات النقدية والبنوك (تبدأ بـ 111)
    const cashAccounts = await this.prisma.core_accounts.findMany({
      where: {
        businessId,
        code: { startsWith: '111' },
        isParent: false,
        isActive: true,
        deletedAt: null,
      },
    });

    const cashAccountIds = cashAccounts.map(a => a.id);

    // جلب جميع القيود المرحلة في الفترة التي تتضمن حسابات نقدية
    const journalEntries = await this.prisma.core_journal_entries.findMany({
      where: {
        businessId,
        status: 'posted',
        entryDate: {
          gte: periodStart,
          lte: periodEnd,
        },
        lines: {
          some: {
            accountId: { in: cashAccountIds },
          },
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: { entryDate: 'asc' },
    });

    // تصنيف التدفقات النقدية
    const operatingActivities: any[] = [];
    const investingActivities: any[] = [];
    const financingActivities: any[] = [];

    // حساب الرصيد الافتتاحي
    const openingBalanceLines = await this.prisma.core_journal_entry_lines.findMany({
      where: {
        accountId: { in: cashAccountIds },
        journalEntry: {
          businessId,
          status: 'posted',
          entryDate: { lt: periodStart },
        },
      },
    });

    const openingBalance = openingBalanceLines.reduce((sum, line) => {
      return sum + Number(line.debit) - Number(line.credit);
    }, 0);

    // تحليل كل قيد
    for (const entry of journalEntries) {
      const cashLines = entry.lines.filter(l => cashAccountIds.includes(l.accountId));
      const otherLines = entry.lines.filter(l => !cashAccountIds.includes(l.accountId));

      // حساب صافي التدفق النقدي لهذا القيد
      const cashFlow = cashLines.reduce((sum, line) => {
        return sum + Number(line.debit) - Number(line.credit);
      }, 0);

      if (cashFlow === 0) continue;

      // تحديد نوع النشاط بناءً على الحسابات المقابلة
      const activity = {
        date: entry.entryDate,
        entryNumber: entry.entryNumber,
        description: entry.description,
        amount: cashFlow,
        accounts: otherLines.map(l => ({
          code: l.account.code,
          name: l.account.name,
        })),
      };

      // تصنيف النشاط
      const otherAccountTypes = otherLines.map(l => l.account.type);
      const otherAccountCodes = otherLines.map(l => l.account.code);

      // الأنشطة الاستثمارية: الأصول الثابتة (12x)
      if (otherAccountCodes.some(code => code.startsWith('12'))) {
        investingActivities.push(activity);
      }
      // الأنشطة التمويلية: حقوق الملكية (3x) أو القروض (23x)
      else if (
        otherAccountTypes.includes('equity') ||
        otherAccountCodes.some(code => code.startsWith('23'))
      ) {
        financingActivities.push(activity);
      }
      // الأنشطة التشغيلية: كل شيء آخر
      else {
        operatingActivities.push(activity);
      }
    }

    // حساب المجاميع
    const totalOperating = operatingActivities.reduce((sum, a) => sum + a.amount, 0);
    const totalInvesting = investingActivities.reduce((sum, a) => sum + a.amount, 0);
    const totalFinancing = financingActivities.reduce((sum, a) => sum + a.amount, 0);
    const netCashFlow = totalOperating + totalInvesting + totalFinancing;
    const closingBalance = openingBalance + netCashFlow;

    // تجميع الأنشطة حسب الوصف
    const groupActivities = (activities: any[]) => {
      const grouped: { [key: string]: { description: string; amount: number; count: number } } = {};
      
      for (const activity of activities) {
        const key = activity.description || 'غير محدد';
        if (!grouped[key]) {
          grouped[key] = { description: key, amount: 0, count: 0 };
        }
        grouped[key].amount += activity.amount;
        grouped[key].count += 1;
      }

      return Object.values(grouped).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    };

    return {
      periodStart,
      periodEnd,
      openingBalance,
      operatingActivities: {
        items: groupActivities(operatingActivities),
        total: totalOperating,
        details: operatingActivities,
      },
      investingActivities: {
        items: groupActivities(investingActivities),
        total: totalInvesting,
        details: investingActivities,
      },
      financingActivities: {
        items: groupActivities(financingActivities),
        total: totalFinancing,
        details: financingActivities,
      },
      netCashFlow,
      closingBalance,
      summary: {
        cashInflows: operatingActivities.filter(a => a.amount > 0).reduce((s, a) => s + a.amount, 0) +
                     investingActivities.filter(a => a.amount > 0).reduce((s, a) => s + a.amount, 0) +
                     financingActivities.filter(a => a.amount > 0).reduce((s, a) => s + a.amount, 0),
        cashOutflows: Math.abs(
          operatingActivities.filter(a => a.amount < 0).reduce((s, a) => s + a.amount, 0) +
          investingActivities.filter(a => a.amount < 0).reduce((s, a) => s + a.amount, 0) +
          financingActivities.filter(a => a.amount < 0).reduce((s, a) => s + a.amount, 0)
        ),
      },
    };
  }

  /**
   * تقرير أعمار الديون (Aging Report)
   * يعرض المبالغ المستحقة مصنفة حسب العمر
   */
  async getAgingReport(
    businessId: string,
    type: 'receivables' | 'payables',
    asOfDate: Date,
  ) {
    // تحديد نوع الحسابات بناءً على النوع
    const accountCodePrefix = type === 'receivables' ? '113' : '211';
    
    // جلب الحسابات
    const accounts = await this.prisma.core_accounts.findMany({
      where: {
        businessId,
        code: { startsWith: accountCodePrefix },
        isParent: false,
        isActive: true,
        deletedAt: null,
      },
    });

    const accountIds = accounts.map(a => a.id);

    // جلب جميع القيود المرحلة حتى تاريخ التقرير
    const journalLines = await this.prisma.core_journal_entry_lines.findMany({
      where: {
        accountId: { in: accountIds },
        journalEntry: {
          businessId,
          status: 'posted',
          entryDate: { lte: asOfDate },
        },
      },
      include: {
        journalEntry: {
          select: {
            entryDate: true,
            entryNumber: true,
            description: true,
          },
        },
        account: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    // تصنيف حسب العمر
    const now = asOfDate.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    const agingBuckets = {
      current: { label: 'جاري (0-30 يوم)', min: 0, max: 30, items: [] as any[], total: 0 },
      days31_60: { label: '31-60 يوم', min: 31, max: 60, items: [] as any[], total: 0 },
      days61_90: { label: '61-90 يوم', min: 61, max: 90, items: [] as any[], total: 0 },
      days91_120: { label: '91-120 يوم', min: 91, max: 120, items: [] as any[], total: 0 },
      over120: { label: 'أكثر من 120 يوم', min: 121, max: Infinity, items: [] as any[], total: 0 },
    };

    // تجميع الأرصدة حسب الحساب
    const accountBalances: { [key: string]: { account: any; balance: number; entries: any[] } } = {};

    for (const line of journalLines) {
      const accountId = line.accountId;
      if (!accountBalances[accountId]) {
        accountBalances[accountId] = {
          account: line.account,
          balance: 0,
          entries: [],
        };
      }

      const amount = type === 'receivables'
        ? Number(line.debit) - Number(line.credit)
        : Number(line.credit) - Number(line.debit);

      accountBalances[accountId].balance += amount;
      
      if (amount !== 0) {
        const entryDate = new Date(line.journalEntry.entryDate).getTime();
        const ageDays = Math.floor((now - entryDate) / dayMs);
        
        accountBalances[accountId].entries.push({
          date: line.journalEntry.entryDate,
          entryNumber: line.journalEntry.entryNumber,
          description: line.journalEntry.description,
          amount,
          ageDays,
        });
      }
    }

    // تصنيف الأرصدة في الفئات العمرية
    const agingDetails: any[] = [];

    for (const [accountId, data] of Object.entries(accountBalances)) {
      if (data.balance <= 0) continue;

      const accountAging = {
        accountCode: data.account.code,
        accountName: data.account.name,
        totalBalance: data.balance,
        current: 0,
        days31_60: 0,
        days61_90: 0,
        days91_120: 0,
        over120: 0,
      };

      // توزيع الرصيد على الفئات العمرية (FIFO)
      let remainingBalance = data.balance;
      const sortedEntries = data.entries
        .filter(e => e.amount > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const entry of sortedEntries) {
        if (remainingBalance <= 0) break;

        const allocatedAmount = Math.min(entry.amount, remainingBalance);
        remainingBalance -= allocatedAmount;

        if (entry.ageDays <= 30) {
          accountAging.current += allocatedAmount;
          agingBuckets.current.total += allocatedAmount;
        } else if (entry.ageDays <= 60) {
          accountAging.days31_60 += allocatedAmount;
          agingBuckets.days31_60.total += allocatedAmount;
        } else if (entry.ageDays <= 90) {
          accountAging.days61_90 += allocatedAmount;
          agingBuckets.days61_90.total += allocatedAmount;
        } else if (entry.ageDays <= 120) {
          accountAging.days91_120 += allocatedAmount;
          agingBuckets.days91_120.total += allocatedAmount;
        } else {
          accountAging.over120 += allocatedAmount;
          agingBuckets.over120.total += allocatedAmount;
        }
      }

      agingDetails.push(accountAging);
    }

    const grandTotal = Object.values(agingBuckets).reduce((sum, b) => sum + b.total, 0);

    return {
      type,
      typeName: type === 'receivables' ? 'المدينون' : 'الدائنون',
      asOfDate,
      summary: {
        current: agingBuckets.current.total,
        days31_60: agingBuckets.days31_60.total,
        days61_90: agingBuckets.days61_90.total,
        days91_120: agingBuckets.days91_120.total,
        over120: agingBuckets.over120.total,
        grandTotal,
      },
      percentages: {
        current: grandTotal > 0 ? (agingBuckets.current.total / grandTotal * 100).toFixed(1) : '0',
        days31_60: grandTotal > 0 ? (agingBuckets.days31_60.total / grandTotal * 100).toFixed(1) : '0',
        days61_90: grandTotal > 0 ? (agingBuckets.days61_90.total / grandTotal * 100).toFixed(1) : '0',
        days91_120: grandTotal > 0 ? (agingBuckets.days91_120.total / grandTotal * 100).toFixed(1) : '0',
        over120: grandTotal > 0 ? (agingBuckets.over120.total / grandTotal * 100).toFixed(1) : '0',
      },
      details: agingDetails.sort((a, b) => b.totalBalance - a.totalBalance),
      riskAnalysis: {
        lowRisk: agingBuckets.current.total + agingBuckets.days31_60.total,
        mediumRisk: agingBuckets.days61_90.total + agingBuckets.days91_120.total,
        highRisk: agingBuckets.over120.total,
      },
    };
  }

  /**
   * تقرير التحصيلات (Collections Report)
   */
  async getCollectionsReport(
    businessId: string,
    periodStart: Date,
    periodEnd: Date,
    groupBy: 'day' | 'week' | 'month' | 'collector' | 'cashBox' = 'day',
  ) {
    // جلب التحصيلات في الفترة
    const collections = await this.prisma.core_collections.findMany({
      where: {
        businessId,
        collectionDate: {
          gte: periodStart,
          lte: periodEnd,
        },
        status: { in: ['confirmed', 'deposited'] as any },
      },
      include: {
        collector: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        session: true,
      },
      orderBy: { collectionDate: 'asc' },
    });

    // تجميع البيانات حسب المعيار المحدد
    const grouped: { [key: string]: { label: string; cash: number; card: number; transfer: number; check: number; total: number; count: number } } = {};

    for (const collection of collections) {
      let key: string;
      let label: string;

      switch (groupBy) {
        case 'day':
          key = new Date(collection.collectionDate).toISOString().split('T')[0];
          label = key;
          break;
        case 'week':
          const weekStart = new Date(collection.collectionDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          label = `أسبوع ${key}`;
          break;
        case 'month':
          key = new Date(collection.collectionDate).toISOString().slice(0, 7);
          label = key;
          break;
        case 'collector':
          key = collection.collectorId || 'unknown';
          label = (collection as any).collector?.user?.name || 'غير محدد';
          break;
        case 'cashBox':
          key = collection.sessionId || 'unknown';
          label = key;
          break;
        default:
          key = 'all';
          label = 'الكل';
      }

      if (!grouped[key]) {
        grouped[key] = { label, cash: 0, card: 0, transfer: 0, check: 0, total: 0, count: 0 };
      }

      const amount = Number(collection.amount);
      grouped[key].total += amount;
      grouped[key].count += 1;

      switch (collection.paymentMethod) {
        case 'cash':
          grouped[key].cash += amount;
          break;
        case 'credit_card':
          grouped[key].card += amount;
          break;
        case 'bank_transfer':
          grouped[key].transfer += amount;
          break;
        case 'check':
          grouped[key].check += amount;
          break;
      }
    }

    const data = Object.entries(grouped)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => {
        if (groupBy === 'collector' || groupBy === 'cashBox') {
          return b.total - a.total;
        }
        return a.key.localeCompare(b.key);
      });

    // حساب الإجماليات
    const totals = data.reduce(
      (acc, item) => ({
        cash: acc.cash + item.cash,
        card: acc.card + item.card,
        transfer: acc.transfer + item.transfer,
        check: acc.check + item.check,
        total: acc.total + item.total,
        count: acc.count + item.count,
      }),
      { cash: 0, card: 0, transfer: 0, check: 0, total: 0, count: 0 }
    );

    // حساب المتوسطات
    const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    return {
      periodStart,
      periodEnd,
      groupBy,
      data,
      totals,
      averages: {
        dailyAverage: totals.total / daysInPeriod,
        averagePerCollection: totals.count > 0 ? totals.total / totals.count : 0,
      },
      paymentMethodBreakdown: {
        cash: { amount: totals.cash, percentage: totals.total > 0 ? (totals.cash / totals.total * 100).toFixed(1) : '0' },
        card: { amount: totals.card, percentage: totals.total > 0 ? (totals.card / totals.total * 100).toFixed(1) : '0' },
        transfer: { amount: totals.transfer, percentage: totals.total > 0 ? (totals.transfer / totals.total * 100).toFixed(1) : '0' },
        check: { amount: totals.check, percentage: totals.total > 0 ? (totals.check / totals.total * 100).toFixed(1) : '0' },
      },
    };
  }

  /**
   * تقرير المقارنة بين الفترات (Period Comparison Report)
   */
  async getPeriodComparisonReport(
    businessId: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    previousPeriodStart: Date,
    previousPeriodEnd: Date,
  ) {
    // جلب بيانات الفترة الحالية
    const [currentIncome, previousIncome] = await Promise.all([
      this.getIncomeStatement(businessId, currentPeriodStart, currentPeriodEnd),
      this.getIncomeStatement(businessId, previousPeriodStart, previousPeriodEnd),
    ]);

    // حساب التغييرات
    const calculateChange = (current: number, previous: number) => {
      const change = current - previous;
      const percentageChange = previous !== 0 ? ((change / previous) * 100) : (current !== 0 ? 100 : 0);
      return {
        current,
        previous,
        change,
        percentageChange: Number(percentageChange.toFixed(2)),
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      };
    };

    // مقارنة الإيرادات حسب الحساب
    const revenueComparison = currentIncome.revenue.accounts.map(currentAcc => {
      const previousAcc = previousIncome.revenue.accounts.find(a => a.code === currentAcc.code);
      return {
        code: currentAcc.code,
        name: currentAcc.name,
        ...calculateChange(currentAcc.balance, previousAcc?.balance || 0),
      };
    });

    // إضافة الحسابات التي كانت في الفترة السابقة فقط
    for (const prevAcc of previousIncome.revenue.accounts) {
      if (!revenueComparison.find(a => a.code === prevAcc.code)) {
        revenueComparison.push({
          code: prevAcc.code,
          name: prevAcc.name,
          ...calculateChange(0, prevAcc.balance),
        });
      }
    }

    // مقارنة المصروفات حسب الحساب
    const expenseComparison = currentIncome.expenses.accounts.map(currentAcc => {
      const previousAcc = previousIncome.expenses.accounts.find(a => a.code === currentAcc.code);
      return {
        code: currentAcc.code,
        name: currentAcc.name,
        ...calculateChange(currentAcc.balance, previousAcc?.balance || 0),
      };
    });

    // إضافة الحسابات التي كانت في الفترة السابقة فقط
    for (const prevAcc of previousIncome.expenses.accounts) {
      if (!expenseComparison.find(a => a.code === prevAcc.code)) {
        expenseComparison.push({
          code: prevAcc.code,
          name: prevAcc.name,
          ...calculateChange(0, prevAcc.balance),
        });
      }
    }

    return {
      currentPeriod: {
        start: currentPeriodStart,
        end: currentPeriodEnd,
      },
      previousPeriod: {
        start: previousPeriodStart,
        end: previousPeriodEnd,
      },
      summary: {
        revenue: calculateChange(currentIncome.revenue.total, previousIncome.revenue.total),
        expenses: calculateChange(currentIncome.expenses.total, previousIncome.expenses.total),
        netIncome: calculateChange(currentIncome.netIncome, previousIncome.netIncome),
        profitMargin: {
          current: currentIncome.revenue.total > 0 
            ? Number((currentIncome.netIncome / currentIncome.revenue.total * 100).toFixed(2)) 
            : 0,
          previous: previousIncome.revenue.total > 0 
            ? Number((previousIncome.netIncome / previousIncome.revenue.total * 100).toFixed(2)) 
            : 0,
        },
      },
      revenueDetails: revenueComparison.sort((a, b) => b.current - a.current),
      expenseDetails: expenseComparison.sort((a, b) => b.current - a.current),
      insights: this.generateComparisonInsights(
        currentIncome,
        previousIncome,
        revenueComparison,
        expenseComparison,
      ),
    };
  }

  /**
   * توليد رؤى تحليلية للمقارنة
   */
  private generateComparisonInsights(
    currentIncome: any,
    previousIncome: any,
    revenueComparison: any[],
    expenseComparison: any[],
  ): string[] {
    const insights: string[] = [];

    // تحليل الإيرادات
    const revenueChange = currentIncome.revenue.total - previousIncome.revenue.total;
    const revenueChangePercent = previousIncome.revenue.total > 0 
      ? (revenueChange / previousIncome.revenue.total * 100) 
      : 0;

    if (revenueChangePercent > 10) {
      insights.push(`📈 نمو قوي في الإيرادات بنسبة ${revenueChangePercent.toFixed(1)}%`);
    } else if (revenueChangePercent < -10) {
      insights.push(`📉 انخفاض ملحوظ في الإيرادات بنسبة ${Math.abs(revenueChangePercent).toFixed(1)}%`);
    }

    // تحليل المصروفات
    const expenseChange = currentIncome.expenses.total - previousIncome.expenses.total;
    const expenseChangePercent = previousIncome.expenses.total > 0 
      ? (expenseChange / previousIncome.expenses.total * 100) 
      : 0;

    if (expenseChangePercent > 15) {
      insights.push(`⚠️ ارتفاع كبير في المصروفات بنسبة ${expenseChangePercent.toFixed(1)}%`);
    } else if (expenseChangePercent < -10) {
      insights.push(`✅ تحسن في ضبط المصروفات بنسبة ${Math.abs(expenseChangePercent).toFixed(1)}%`);
    }

    // تحليل صافي الربح
    const netIncomeChange = currentIncome.netIncome - previousIncome.netIncome;
    if (currentIncome.netIncome > 0 && previousIncome.netIncome < 0) {
      insights.push(`🎉 تحول من الخسارة إلى الربح`);
    } else if (currentIncome.netIncome < 0 && previousIncome.netIncome > 0) {
      insights.push(`⛔ تحول من الربح إلى الخسارة`);
    }

    // أكبر زيادة في الإيرادات
    const topRevenueGrowth = revenueComparison
      .filter(r => r.percentageChange > 0)
      .sort((a, b) => b.change - a.change)[0];
    if (topRevenueGrowth && topRevenueGrowth.change > 0) {
      insights.push(`💰 أعلى نمو في الإيرادات: ${topRevenueGrowth.name} (+${topRevenueGrowth.percentageChange}%)`);
    }

    // أكبر زيادة في المصروفات
    const topExpenseGrowth = expenseComparison
      .filter(e => e.percentageChange > 20)
      .sort((a, b) => b.change - a.change)[0];
    if (topExpenseGrowth) {
      insights.push(`📊 أعلى زيادة في المصروفات: ${topExpenseGrowth.name} (+${topExpenseGrowth.percentageChange}%)`);
    }

    return insights;
  }

  /**
   * تقرير ملخص يومي (Daily Summary Report)
   */
  async getDailySummaryReport(businessId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // جلب القيود المرحلة اليوم
    const journalEntries = await this.prisma.core_journal_entries.findMany({
      where: {
        businessId,
        status: 'posted',
        postedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        lines: {
          include: {
            account: {
              select: { code: true, name: true, type: true },
            },
          },
        },
      },
    });

    // جلب التحصيلات اليوم
    const collections = await this.prisma.core_collections.findMany({
      where: {
        businessId,
        collectionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // جلب أوامر الدفع المعتمدة اليوم
    const paymentOrders = await this.prisma.core_payment_orders.findMany({
      where: {
        businessId,
        approvedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // حساب الإحصائيات
    const totalDebit = journalEntries.reduce((sum, e) => sum + Number(e.totalDebit), 0);
    const totalCredit = journalEntries.reduce((sum, e) => sum + Number(e.totalCredit), 0);
    const totalCollections = collections.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalPayments = paymentOrders.reduce((sum, p) => sum + Number(p.totalAmount), 0);

    // تجميع حسب نوع الحساب
    const accountTypeTotals: { [key: string]: { debit: number; credit: number } } = {};
    for (const entry of journalEntries) {
      for (const line of entry.lines) {
        const type = line.account.type;
        if (!accountTypeTotals[type]) {
          accountTypeTotals[type] = { debit: 0, credit: 0 };
        }
        accountTypeTotals[type].debit += Number(line.debit);
        accountTypeTotals[type].credit += Number(line.credit);
      }
    }

    return {
      date,
      journalEntries: {
        count: journalEntries.length,
        totalDebit,
        totalCredit,
        byType: accountTypeTotals,
      },
      collections: {
        count: collections.length,
        total: totalCollections,
        byMethod: {
          cash: collections.filter(c => c.paymentMethod === 'cash').reduce((s, c) => s + Number(c.amount), 0),
          card: collections.filter(c => c.paymentMethod === 'credit_card').reduce((s, c) => s + Number(c.amount), 0),
          transfer: collections.filter(c => c.paymentMethod === 'bank_transfer').reduce((s, c) => s + Number(c.amount), 0),
          check: collections.filter(c => c.paymentMethod === 'check').reduce((s, c) => s + Number(c.amount), 0),
        },
      },
      paymentOrders: {
        count: paymentOrders.length,
        total: totalPayments,
      },
      netCashFlow: totalCollections - totalPayments,
    };
  }
}
