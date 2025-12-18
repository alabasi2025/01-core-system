import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateClearingAccountDto,
  UpdateClearingAccountDto,
  CreateClearingEntryDto,
  UpdateClearingEntryDto,
  ClearingEntryFilterDto,
  ReconcileBasketDto,
} from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ClearingService {
  constructor(private prisma: PrismaService) {}

  // ==================== Clearing Accounts ====================

  async findAllAccounts(businessId: string) {
    return this.prisma.core_clearing_accounts.findMany({
      where: { businessId },
      orderBy: { code: 'asc' },
    });
  }

  async findAccountById(id: string, businessId: string) {
    const account = await this.prisma.core_clearing_accounts.findFirst({
      where: { id, businessId },
      include: {
        entries: {
          where: { status: 'pending' },
          orderBy: { entryDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!account) {
      throw new NotFoundException('الحساب الوسيط غير موجود');
    }

    return account;
  }

  async createAccount(businessId: string, dto: CreateClearingAccountDto) {
    // التحقق من عدم تكرار الكود
    const existing = await this.prisma.core_clearing_accounts.findFirst({
      where: { businessId, code: dto.code },
    });

    if (existing) {
      throw new BadRequestException('كود الحساب الوسيط موجود مسبقاً');
    }

    return this.prisma.core_clearing_accounts.create({
      data: {
        businessId,
        ...dto,
        balance: 0,
      },
    });
  }

  async updateAccount(id: string, businessId: string, dto: UpdateClearingAccountDto) {
    const account = await this.findAccountById(id, businessId);

    return this.prisma.core_clearing_accounts.update({
      where: { id: account.id },
      data: dto,
    });
  }

  async getAccountBalance(id: string, businessId: string) {
    const account = await this.findAccountById(id, businessId);

    // حساب الرصيد من القيود المعلقة
    const pendingEntries = await this.prisma.core_clearing_entries.aggregate({
      where: {
        clearingAccountId: id,
        status: 'pending',
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      accountId: id,
      accountName: account.name,
      balance: account.balance,
      pendingAmount: pendingEntries._sum.amount || 0,
      pendingCount: pendingEntries._count,
    };
  }

  // ==================== Clearing Entries ====================

  async findAllEntries(businessId: string, filter: ClearingEntryFilterDto) {
    const { clearingAccountId, status, startDate, endDate, page = 1, limit = 20 } = filter;

    const where: any = {};

    if (clearingAccountId) {
      where.clearingAccountId = clearingAccountId;
    } else {
      // فقط القيود التابعة لحسابات المجموعة
      const accounts = await this.prisma.core_clearing_accounts.findMany({
        where: { businessId },
        select: { id: true },
      });
      where.clearingAccountId = { in: accounts.map(a => a.id) };
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      this.prisma.core_clearing_entries.findMany({
        where,
        include: {
          clearingAccount: {
            select: { id: true, name: true, code: true, type: true },
          },
        },
        orderBy: { entryDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.core_clearing_entries.count({ where }),
    ]);

    return {
      data: entries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findEntryById(id: string, businessId: string) {
    const entry = await this.prisma.core_clearing_entries.findFirst({
      where: { id },
      include: {
        clearingAccount: true,
        allocations: true,
      },
    });

    if (!entry) {
      throw new NotFoundException('القيد غير موجود');
    }

    // التحقق من أن القيد تابع للمجموعة
    const account = await this.prisma.core_clearing_accounts.findFirst({
      where: { id: entry.clearingAccountId, businessId },
    });

    if (!account) {
      throw new NotFoundException('القيد غير موجود');
    }

    return entry;
  }

  async createEntry(businessId: string, dto: CreateClearingEntryDto) {
    // التحقق من أن الحساب الوسيط تابع للمجموعة
    const account = await this.prisma.core_clearing_accounts.findFirst({
      where: { id: dto.clearingAccountId, businessId },
    });

    if (!account) {
      throw new NotFoundException('الحساب الوسيط غير موجود');
    }

    const entry = await this.prisma.core_clearing_entries.create({
      data: {
        clearingAccountId: dto.clearingAccountId,
        entryDate: new Date(dto.entryDate),
        amount: dto.amount,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        referenceNumber: dto.referenceNumber,
        description: dto.description,
        status: 'pending',
      },
      include: {
        clearingAccount: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // تحديث رصيد الحساب الوسيط
    await this.prisma.core_clearing_accounts.update({
      where: { id: dto.clearingAccountId },
      data: {
        balance: { increment: dto.amount },
      },
    });

    return entry;
  }

  async updateEntry(id: string, businessId: string, dto: UpdateClearingEntryDto) {
    const entry = await this.findEntryById(id, businessId);

    if (entry.status !== 'pending') {
      throw new BadRequestException('لا يمكن تعديل قيد تمت تسويته');
    }

    return this.prisma.core_clearing_entries.update({
      where: { id },
      data: dto,
    });
  }

  async deleteEntry(id: string, businessId: string) {
    const entry = await this.findEntryById(id, businessId);

    if (entry.status !== 'pending') {
      throw new BadRequestException('لا يمكن حذف قيد تمت تسويته');
    }

    // تحديث رصيد الحساب الوسيط
    await this.prisma.core_clearing_accounts.update({
      where: { id: entry.clearingAccountId },
      data: {
        balance: { decrement: entry.amount },
      },
    });

    return this.prisma.core_clearing_entries.delete({
      where: { id },
    });
  }

  // ==================== Reconciliation Basket ====================

  async getUnreconciledEntries(businessId: string, accountIds?: string[]) {
    const where: any = {
      status: 'pending',
    };

    if (accountIds && accountIds.length > 0) {
      where.clearingAccountId = { in: accountIds };
    } else {
      const accounts = await this.prisma.core_clearing_accounts.findMany({
        where: { businessId, isActive: true },
        select: { id: true },
      });
      where.clearingAccountId = { in: accounts.map(a => a.id) };
    }

    const entries = await this.prisma.core_clearing_entries.findMany({
      where,
      include: {
        clearingAccount: {
          select: { id: true, name: true, code: true, type: true },
        },
      },
      orderBy: { entryDate: 'desc' },
    });

    // تجميع حسب الحساب الوسيط
    const grouped = entries.reduce((acc, entry) => {
      const accountId = entry.clearingAccountId;
      if (!acc[accountId]) {
        acc[accountId] = {
          account: entry.clearingAccount,
          entries: [],
          totalDebit: 0,
          totalCredit: 0,
        };
      }
      acc[accountId].entries.push(entry);
      const amount = Number(entry.amount);
      if (amount > 0) {
        acc[accountId].totalDebit += amount;
      } else {
        acc[accountId].totalCredit += Math.abs(amount);
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }

  async reconcileBasket(businessId: string, userId: string, dto: ReconcileBasketDto) {
    const { debitEntryIds, creditEntryIds, notes } = dto;

    // جلب القيود المدينة
    const debitEntries = await this.prisma.core_clearing_entries.findMany({
      where: {
        id: { in: debitEntryIds },
        status: 'pending',
      },
    });

    // جلب القيود الدائنة
    const creditEntries = await this.prisma.core_clearing_entries.findMany({
      where: {
        id: { in: creditEntryIds },
        status: 'pending',
      },
    });

    // التحقق من أن جميع القيود موجودة
    if (debitEntries.length !== debitEntryIds.length) {
      throw new BadRequestException('بعض القيود المدينة غير موجودة أو تمت تسويتها');
    }

    if (creditEntries.length !== creditEntryIds.length) {
      throw new BadRequestException('بعض القيود الدائنة غير موجودة أو تمت تسويتها');
    }

    // حساب المجاميع
    const totalDebit = debitEntries.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCredit = creditEntries.reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    // التحقق من تطابق المجاميع
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `إجمالي المدين (${totalDebit}) لا يساوي إجمالي الدائن (${totalCredit})`
      );
    }

    // إنشاء التسوية
    const reconciliation = await this.prisma.core_reconciliations.create({
      data: {
        businessId,
        type: 'bank', // يمكن تحديده بناءً على نوع الحسابات
        name: `تسوية ${new Date().toLocaleDateString('ar-EG')}`,
        periodStart: new Date(),
        periodEnd: new Date(),
        status: 'finalized',
        totalItems: debitEntries.length + creditEntries.length,
        matchedItems: debitEntries.length + creditEntries.length,
        unmatchedItems: 0,
        totalAmount: totalDebit,
        matchedAmount: totalDebit,
        createdBy: userId,
        finalizedBy: userId,
        finalizedAt: new Date(),
      },
    });

    // تحديث حالة القيود
    const allEntryIds = [...debitEntryIds, ...creditEntryIds];
    await this.prisma.core_clearing_entries.updateMany({
      where: { id: { in: allEntryIds } },
      data: {
        status: 'matched',
        matchedAt: new Date(),
      },
    });

    // إنشاء سجل المطابقة
    const matchType = debitEntries.length === 1 && creditEntries.length === 1
      ? 'one_to_one'
      : debitEntries.length === 1
        ? 'one_to_many'
        : creditEntries.length === 1
          ? 'many_to_one'
          : 'many_to_many';

    await this.prisma.core_reconciliation_matches.create({
      data: {
        reconciliationId: reconciliation.id,
        matchType,
        amount: totalDebit,
        notes,
      },
    });

    // تحديث أرصدة الحسابات الوسيطة
    for (const entry of [...debitEntries, ...creditEntries]) {
      await this.prisma.core_clearing_accounts.update({
        where: { id: entry.clearingAccountId },
        data: {
          balance: { decrement: entry.amount },
        },
      });
    }

    return {
      reconciliationId: reconciliation.id,
      matchType,
      totalDebit,
      totalCredit,
      entriesCount: allEntryIds.length,
      message: 'تمت التسوية بنجاح',
    };
  }

  // ==================== Seed ====================

  async seedClearingAccounts(businessId: string) {
    const clearingAccountsData = [
      {
        code: '221',
        name: 'وسيط صندوق التحصيل',
        nameEn: 'Collection Cash Box Clearing',
        type: 'bank' as const,
        systemAccount: 'clearing_cash_box',
      },
      {
        code: '222',
        name: 'وسيط بنك الحوشبي',
        nameEn: 'Al-Hawshabi Bank Clearing',
        type: 'bank' as const,
        systemAccount: 'clearing_bank_hawshabi',
      },
      {
        code: '223',
        name: 'وسيط إيرادات الفوترة',
        nameEn: 'Billing Revenue Clearing',
        type: 'revenue' as const,
        systemAccount: 'clearing_revenue_billing',
      },
      {
        code: '224',
        name: 'وسيط إيرادات الدفع المسبق',
        nameEn: 'Prepaid Revenue Clearing',
        type: 'revenue' as const,
        systemAccount: 'clearing_revenue_prepaid',
      },
      {
        code: '225',
        name: 'وسيط إيرادات صندوق الدعم',
        nameEn: 'Subsidy Fund Revenue Clearing',
        type: 'revenue' as const,
        systemAccount: 'clearing_revenue_subsidy',
      },
      {
        code: '226',
        name: 'وسيط الموردين',
        nameEn: 'Suppliers Clearing',
        type: 'expense' as const,
        systemAccount: 'clearing_suppliers',
      },
    ];

    let created = 0;
    let updated = 0;

    for (const data of clearingAccountsData) {
      // البحث عن الحساب المرتبط في شجرة الحسابات
      const account = await this.prisma.core_accounts.findFirst({
        where: { businessId, systemAccount: data.systemAccount },
      });

      const existing = await this.prisma.core_clearing_accounts.findFirst({
        where: { businessId, code: data.code },
      });

      if (existing) {
        await this.prisma.core_clearing_accounts.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            nameEn: data.nameEn,
            type: data.type,
            accountId: account?.id || existing.accountId,
          },
        });
        updated++;
      } else {
        await this.prisma.core_clearing_accounts.create({
          data: {
            businessId,
            accountId: account?.id || '',
            code: data.code,
            name: data.name,
            nameEn: data.nameEn,
            type: data.type,
            balance: 0,
          },
        });
        created++;
      }
    }

    return { created, updated };
  }

  // ==================== Statistics ====================

  async getStatistics(businessId: string) {
    const accounts = await this.prisma.core_clearing_accounts.findMany({
      where: { businessId, isActive: true },
      include: {
        entries: {
          where: { status: 'pending' },
        },
      },
    });

    const stats = accounts.map(account => ({
      id: account.id,
      name: account.name,
      code: account.code,
      type: account.type,
      balance: account.balance,
      pendingCount: account.entries.length,
      pendingAmount: account.entries.reduce((sum, e) => sum + Number(e.amount), 0),
    }));

    const totals = {
      totalAccounts: accounts.length,
      totalPendingEntries: stats.reduce((sum, s) => sum + s.pendingCount, 0),
      totalPendingAmount: stats.reduce((sum, s) => sum + s.pendingAmount, 0),
    };

    return { accounts: stats, totals };
  }
}
