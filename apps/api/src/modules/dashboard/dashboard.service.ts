import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashBalance: number;
  receivables: number;
  payables: number;
}

export interface RevenueChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface CollectionStats {
  todayCollections: number;
  weekCollections: number;
  monthCollections: number;
  pendingCollections: number;
  totalCollectors: number;
  activeCollectors: number;
}

export interface PendingReconciliation {
  id: string;
  accountName: string;
  accountCode: string;
  pendingAmount: number;
  pendingCount: number;
  oldestDate: Date;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  link?: string;
  createdAt: Date;
}

export interface DashboardStatistics {
  financialSummary: FinancialSummary;
  revenueChart: RevenueChartData;
  collectionStats: CollectionStats;
  pendingReconciliations: PendingReconciliation[];
  alerts: DashboardAlert[];
  recentTransactions: any[];
  paymentOrdersStats: {
    pending: number;
    approved: number;
    overdue: number;
    totalPending: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancialSummary(businessId: string): Promise<FinancialSummary> {
    // Get account balances by type
    const accountBalances = await this.prisma.$queryRaw<any[]>`
      SELECT 
        a.type,
        a.nature,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM core_accounts a
      LEFT JOIN core_journal_entry_lines jl ON jl.account_id = a.id
      LEFT JOIN core_journal_entries je ON je.id = jl.journal_entry_id AND je.status = 'posted'
      WHERE a.business_id = ${businessId}::uuid
        AND a.is_parent = false
        AND a.deleted_at IS NULL
      GROUP BY a.type, a.nature
    `;

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const row of accountBalances) {
      const debit = Number(row.total_debit || 0);
      const credit = Number(row.total_credit || 0);
      const balance = row.nature === 'debit' ? debit - credit : credit - debit;

      switch (row.type) {
        case 'asset':
          totalAssets += balance;
          break;
        case 'liability':
          totalLiabilities += balance;
          break;
        case 'equity':
          totalEquity += balance;
          break;
        case 'revenue':
          totalRevenue += balance;
          break;
        case 'expense':
          totalExpenses += balance;
          break;
      }
    }

    // Get cash balance (accounts with code starting with 11)
    const cashAccounts = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) as balance
      FROM core_accounts a
      LEFT JOIN core_journal_entry_lines jl ON jl.account_id = a.id
      LEFT JOIN core_journal_entries je ON je.id = jl.journal_entry_id AND je.status = 'posted'
      WHERE a.business_id = ${businessId}::uuid
        AND a.code LIKE '11%'
        AND a.is_parent = false
        AND a.deleted_at IS NULL
    `;

    // Get receivables (accounts with code starting with 12)
    const receivablesAccounts = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) as balance
      FROM core_accounts a
      LEFT JOIN core_journal_entry_lines jl ON jl.account_id = a.id
      LEFT JOIN core_journal_entries je ON je.id = jl.journal_entry_id AND je.status = 'posted'
      WHERE a.business_id = ${businessId}::uuid
        AND a.code LIKE '12%'
        AND a.is_parent = false
        AND a.deleted_at IS NULL
    `;

    // Get payables (accounts with code starting with 21)
    const payablesAccounts = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0) as balance
      FROM core_accounts a
      LEFT JOIN core_journal_entry_lines jl ON jl.account_id = a.id
      LEFT JOIN core_journal_entries je ON je.id = jl.journal_entry_id AND je.status = 'posted'
      WHERE a.business_id = ${businessId}::uuid
        AND a.code LIKE '21%'
        AND a.is_parent = false
        AND a.deleted_at IS NULL
    `;

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      cashBalance: Number(cashAccounts[0]?.balance || 0),
      receivables: Number(receivablesAccounts[0]?.balance || 0),
      payables: Number(payablesAccounts[0]?.balance || 0),
    };
  }

  async getRevenueChart(businessId: string, months = 6): Promise<RevenueChartData> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const monthlyData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR(je.entry_date, 'YYYY-MM') as month,
        SUM(CASE WHEN a.type = 'revenue' THEN jl.credit - jl.debit ELSE 0 END) as revenue,
        SUM(CASE WHEN a.type = 'expense' THEN jl.debit - jl.credit ELSE 0 END) as expenses
      FROM core_journal_entries je
      JOIN core_journal_entry_lines jl ON jl.journal_entry_id = je.id
      JOIN core_accounts a ON a.id = jl.account_id
      WHERE je.business_id = ${businessId}::uuid
        AND je.status = 'posted'
        AND je.entry_date >= ${startDate}
        AND a.type IN ('revenue', 'expense')
      GROUP BY TO_CHAR(je.entry_date, 'YYYY-MM')
      ORDER BY month
    `;

    const labels: string[] = [];
    const revenueData: number[] = [];
    const expenseData: number[] = [];

    // Generate all months in range
    const currentDate = new Date(startDate);
    const endDate = new Date();
    
    while (currentDate <= endDate) {
      const monthKey = currentDate.toISOString().substring(0, 7);
      const monthName = currentDate.toLocaleDateString('ar-YE', { month: 'short', year: 'numeric' });
      labels.push(monthName);
      
      const monthData = monthlyData.find(d => d.month === monthKey);
      revenueData.push(Number(monthData?.revenue || 0));
      expenseData.push(Number(monthData?.expenses || 0));
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
      labels,
      datasets: [
        {
          label: 'الإيرادات',
          data: revenueData,
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgb(34, 197, 94)',
        },
        {
          label: 'المصروفات',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgb(239, 68, 68)',
        },
      ],
    };
  }

  async getCollectionStats(businessId: string): Promise<CollectionStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const monthStart = new Date(today);
    monthStart.setDate(1);

    const [todayResult, weekResult, monthResult, pendingResult, collectorsResult] = await Promise.all([
      // Today's collections
      this.prisma.core_collections.aggregate({
        where: {
          collector: { user: { businessId } },
          collectionDate: { gte: today },
          status: 'confirmed',
        },
        _sum: { amount: true },
      }),
      // Week's collections
      this.prisma.core_collections.aggregate({
        where: {
          collector: { user: { businessId } },
          collectionDate: { gte: weekStart },
          status: 'confirmed',
        },
        _sum: { amount: true },
      }),
      // Month's collections
      this.prisma.core_collections.aggregate({
        where: {
          collector: { user: { businessId } },
          collectionDate: { gte: monthStart },
          status: 'confirmed',
        },
        _sum: { amount: true },
      }),
      // Pending collections
      this.prisma.core_collections.aggregate({
        where: {
          collector: { user: { businessId } },
          status: 'pending',
        },
        _sum: { amount: true },
      }),
      // Collectors count
      this.prisma.core_collectors.findMany({
        where: { user: { businessId } },
        select: { isActive: true },
      }),
    ]);

    return {
      todayCollections: Number(todayResult._sum.amount || 0),
      weekCollections: Number(weekResult._sum.amount || 0),
      monthCollections: Number(monthResult._sum.amount || 0),
      pendingCollections: Number(pendingResult._sum.amount || 0),
      totalCollectors: collectorsResult.length,
      activeCollectors: collectorsResult.filter(c => c.isActive).length,
    };
  }

  async getPendingReconciliations(businessId: string): Promise<PendingReconciliation[]> {
    // Get clearing accounts with pending entries
    const clearingAccounts = await this.prisma.core_accounts.findMany({
      where: {
        businessId,
        systemAccount: { startsWith: 'clearing_' },
        deletedAt: null,
      },
      include: {
        journalLines: {
          include: {
            journalEntry: true,
          },
          where: {
            journalEntry: {
              status: 'posted',
            },
          },
        },
      },
    });

    const results: PendingReconciliation[] = [];

    for (const account of clearingAccounts) {
      const debitSum = account.journalLines.reduce((sum, line) => sum + Number(line.debit), 0);
      const creditSum = account.journalLines.reduce((sum, line) => sum + Number(line.credit), 0);
      const pendingAmount = Math.abs(debitSum - creditSum);

      if (pendingAmount > 0) {
        const oldestEntry = account.journalLines
          .map(l => l.journalEntry.entryDate)
          .sort((a, b) => a.getTime() - b.getTime())[0];

        results.push({
          id: account.id,
          accountName: account.name,
          accountCode: account.code,
          pendingAmount,
          pendingCount: account.journalLines.length,
          oldestDate: oldestEntry || new Date(),
        });
      }
    }

    return results.sort((a, b) => b.pendingAmount - a.pendingAmount).slice(0, 5);
  }

  async getAlerts(businessId: string): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];
    const today = new Date();

    // Check for overdue payment orders
    const overduePayments = await this.prisma.core_payment_orders.count({
      where: {
        businessId,
        status: { in: ['approved', 'partially_paid'] },
        dueDate: { lt: today },
      },
    });

    if (overduePayments > 0) {
      alerts.push({
        id: 'overdue-payments',
        type: 'danger',
        title: 'أوامر دفع متأخرة',
        message: `يوجد ${overduePayments} أمر دفع متأخر عن موعد الاستحقاق`,
        link: '/payment-orders?status=approved',
        createdAt: new Date(),
      });
    }

    // Check for pending approvals
    const pendingApprovals = await this.prisma.core_payment_orders.count({
      where: {
        businessId,
        status: 'pending_approval',
      },
    });

    if (pendingApprovals > 0) {
      alerts.push({
        id: 'pending-approvals',
        type: 'warning',
        title: 'أوامر بانتظار الاعتماد',
        message: `يوجد ${pendingApprovals} أمر دفع بانتظار الاعتماد`,
        link: '/payment-orders?status=pending_approval',
        createdAt: new Date(),
      });
    }

    // Check for unposted journal entries
    const draftEntries = await this.prisma.core_journal_entries.count({
      where: {
        businessId,
        status: 'draft',
        deletedAt: null,
      },
    });

    if (draftEntries > 5) {
      alerts.push({
        id: 'draft-entries',
        type: 'info',
        title: 'قيود غير مرحلة',
        message: `يوجد ${draftEntries} قيد يومية بحاجة للترحيل`,
        link: '/journal-entries?status=draft',
        createdAt: new Date(),
      });
    }

    // Check for pending collections
    const pendingCollections = await this.prisma.core_collections.count({
      where: {
        collector: { user: { businessId } },
        status: 'pending',
      },
    });

    if (pendingCollections > 0) {
      alerts.push({
        id: 'pending-collections',
        type: 'warning',
        title: 'تحصيلات معلقة',
        message: `يوجد ${pendingCollections} تحصيل بانتظار التأكيد`,
        link: '/collections?status=pending',
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  async getRecentTransactions(businessId: string, limit = 10): Promise<any[]> {
    const entries = await this.prisma.core_journal_entries.findMany({
      where: {
        businessId,
        status: 'posted',
        deletedAt: null,
      },
      orderBy: { entryDate: 'desc' },
      take: limit,
      select: {
        id: true,
        entryNumber: true,
        entryDate: true,
        description: true,
        totalDebit: true,
        referenceType: true,
      },
    });

    return entries.map(entry => ({
      id: entry.id,
      number: entry.entryNumber,
      date: entry.entryDate,
      description: entry.description,
      amount: Number(entry.totalDebit),
      type: entry.referenceType || 'manual',
    }));
  }

  async getPaymentOrdersStats(businessId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, approved, overdue, totalPending] = await Promise.all([
      this.prisma.core_payment_orders.count({
        where: { businessId, status: 'pending_approval' },
      }),
      this.prisma.core_payment_orders.count({
        where: { businessId, status: 'approved' },
      }),
      this.prisma.core_payment_orders.count({
        where: {
          businessId,
          status: { in: ['approved', 'partially_paid'] },
          dueDate: { lt: today },
        },
      }),
      this.prisma.core_payment_orders.aggregate({
        where: {
          businessId,
          status: { in: ['approved', 'partially_paid'] },
        },
        _sum: { totalAmount: true, paidAmount: true },
      }),
    ]);

    const totalAmount = Number(totalPending._sum.totalAmount || 0);
    const paidAmount = Number(totalPending._sum.paidAmount || 0);

    return {
      pending,
      approved,
      overdue,
      totalPending: totalAmount - paidAmount,
    };
  }

  async getDashboardStatistics(businessId: string): Promise<DashboardStatistics> {
    const [
      financialSummary,
      revenueChart,
      collectionStats,
      pendingReconciliations,
      alerts,
      recentTransactions,
      paymentOrdersStats,
    ] = await Promise.all([
      this.getFinancialSummary(businessId),
      this.getRevenueChart(businessId),
      this.getCollectionStats(businessId),
      this.getPendingReconciliations(businessId),
      this.getAlerts(businessId),
      this.getRecentTransactions(businessId),
      this.getPaymentOrdersStats(businessId),
    ]);

    return {
      financialSummary,
      revenueChart,
      collectionStats,
      pendingReconciliations,
      alerts,
      recentTransactions,
      paymentOrdersStats,
    };
  }
}
