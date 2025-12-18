import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateReconciliationDto,
  UpdateReconciliationDto,
  ReconciliationFilterDto,
  CreateReconciliationRuleDto,
  UpdateReconciliationRuleDto,
  CreateMatchDto,
  AutoMatchDto,
  CreateAllocationDto,
  ResolveExceptionDto,
} from './dto';

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  // ==================== Reconciliations ====================

  async findAll(businessId: string, filter: ReconciliationFilterDto) {
    const { type, status, startDate, endDate, page = 1, limit = 20 } = filter;

    const where: any = { businessId };

    if (type) where.type = type;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.periodStart = {};
      if (startDate) where.periodStart.gte = new Date(startDate);
      if (endDate) where.periodEnd = { lte: new Date(endDate) };
    }

    const [reconciliations, total] = await Promise.all([
      this.prisma.core_reconciliations.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.core_reconciliations.count({ where }),
    ]);

    return {
      data: reconciliations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, businessId: string) {
    const reconciliation = await this.prisma.core_reconciliations.findFirst({
      where: { id, businessId },
      include: {
        matches: true,
        allocations: true,
        exceptions: true,
        history: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!reconciliation) {
      throw new NotFoundException('التسوية غير موجودة');
    }

    return reconciliation;
  }

  async create(businessId: string, userId: string, dto: CreateReconciliationDto) {
    const reconciliation = await this.prisma.core_reconciliations.create({
      data: {
        businessId,
        type: dto.type,
        name: dto.name,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        status: 'draft',
        totalItems: 0,
        matchedItems: 0,
        unmatchedItems: 0,
        totalAmount: 0,
        matchedAmount: 0,
        createdBy: userId,
      },
    });

    // تسجيل في السجل
    await this.prisma.core_reconciliation_history.create({
      data: {
        reconciliationId: reconciliation.id,
        action: 'created',
        details: { name: dto.name, type: dto.type } as any,
        createdBy: userId,
      },
    });

    return reconciliation;
  }

  async update(id: string, businessId: string, userId: string, dto: UpdateReconciliationDto) {
    const reconciliation = await this.findById(id, businessId);

    if (reconciliation.status === 'finalized') {
      throw new BadRequestException('لا يمكن تعديل تسوية مكتملة');
    }

    const updated = await this.prisma.core_reconciliations.update({
      where: { id },
      data: dto,
    });

    // تسجيل في السجل
    await this.prisma.core_reconciliation_history.create({
      data: {
        reconciliationId: id,
        action: 'updated',
        details: dto as any,
        createdBy: userId,
      },
    });

    return updated;
  }

  async finalize(id: string, businessId: string, userId: string) {
    const reconciliation = await this.findById(id, businessId);

    if (reconciliation.status === 'finalized') {
      throw new BadRequestException('التسوية مكتملة بالفعل');
    }

    // التحقق من عدم وجود استثناءات غير محلولة
    const unresolvedExceptions = await this.prisma.core_reconciliation_exceptions.count({
      where: { reconciliationId: id, resolved: false },
    });

    if (unresolvedExceptions > 0) {
      throw new BadRequestException(`يوجد ${unresolvedExceptions} استثناء غير محلول`);
    }

    const updated = await this.prisma.core_reconciliations.update({
      where: { id },
      data: {
        status: 'finalized',
        finalizedBy: userId,
        finalizedAt: new Date(),
      },
    });

    // تسجيل في السجل
    await this.prisma.core_reconciliation_history.create({
      data: {
        reconciliationId: id,
        action: 'finalized',
        details: {},
        createdBy: userId,
      },
    });

    return updated;
  }

  async cancel(id: string, businessId: string, userId: string) {
    const reconciliation = await this.findById(id, businessId);

    if (reconciliation.status === 'finalized') {
      throw new BadRequestException('لا يمكن إلغاء تسوية مكتملة');
    }

    const updated = await this.prisma.core_reconciliations.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // تسجيل في السجل
    await this.prisma.core_reconciliation_history.create({
      data: {
        reconciliationId: id,
        action: 'cancelled',
        details: {},
        createdBy: userId,
      },
    });

    return updated;
  }

  // ==================== Reconciliation Rules ====================

  async findAllRules(businessId: string) {
    return this.prisma.core_reconciliation_rules.findMany({
      where: { businessId },
      orderBy: { priority: 'asc' },
    });
  }

  async createRule(businessId: string, dto: CreateReconciliationRuleDto) {
    return this.prisma.core_reconciliation_rules.create({
      data: {
        businessId,
        name: dto.name,
        nameEn: dto.nameEn,
        priority: dto.priority || 1,
        matchFields: dto.matchFields,
        tolerance: dto.tolerance || null,
      },
    });
  }

  async updateRule(id: string, businessId: string, dto: UpdateReconciliationRuleDto) {
    const rule = await this.prisma.core_reconciliation_rules.findFirst({
      where: { id, businessId },
    });

    if (!rule) {
      throw new NotFoundException('قاعدة التسوية غير موجودة');
    }

    return this.prisma.core_reconciliation_rules.update({
      where: { id },
      data: dto,
    });
  }

  async deleteRule(id: string, businessId: string) {
    const rule = await this.prisma.core_reconciliation_rules.findFirst({
      where: { id, businessId },
    });

    if (!rule) {
      throw new NotFoundException('قاعدة التسوية غير موجودة');
    }

    return this.prisma.core_reconciliation_rules.delete({
      where: { id },
    });
  }

  // ==================== Matching ====================

  async createMatch(businessId: string, userId: string, dto: CreateMatchDto) {
    const reconciliation = await this.findById(dto.reconciliationId, businessId);

    if (reconciliation.status === 'finalized') {
      throw new BadRequestException('لا يمكن إضافة مطابقة لتسوية مكتملة');
    }

    // حساب المبالغ
    const sourceEntries = await this.prisma.core_clearing_entries.findMany({
      where: { id: { in: dto.sourceEntryIds } },
    });

    const targetEntries = await this.prisma.core_clearing_entries.findMany({
      where: { id: { in: dto.targetEntryIds } },
    });

    const sourceTotal = sourceEntries.reduce((sum, e) => sum + Number(e.amount), 0);
    const targetTotal = targetEntries.reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);
    const difference = Math.abs(sourceTotal - targetTotal);

    // تحديد نوع المطابقة
    let matchType = 'manual';
    if (dto.sourceEntryIds.length === 1 && dto.targetEntryIds.length === 1) {
      matchType = 'one_to_one';
    } else if (dto.sourceEntryIds.length === 1) {
      matchType = 'one_to_many';
    } else if (dto.targetEntryIds.length === 1) {
      matchType = 'many_to_one';
    } else {
      matchType = 'many_to_many';
    }

    const match = await this.prisma.core_reconciliation_matches.create({
      data: {
        reconciliationId: dto.reconciliationId,
        matchType: matchType as any,
        amount: sourceTotal,
        difference,
        notes: dto.notes,
      },
    });

    // تحديث حالة القيود
    await this.prisma.core_clearing_entries.updateMany({
      where: { id: { in: [...dto.sourceEntryIds, ...dto.targetEntryIds] } },
      data: {
        status: 'matched',
        matchedAt: new Date(),
      },
    });

    // تحديث إحصائيات التسوية
    await this.updateReconciliationStats(dto.reconciliationId);

    return match;
  }

  async autoMatch(businessId: string, userId: string, dto: AutoMatchDto) {
    const reconciliation = await this.findById(dto.reconciliationId, businessId);

    if (reconciliation.status === 'finalized') {
      throw new BadRequestException('لا يمكن تنفيذ مطابقة تلقائية لتسوية مكتملة');
    }

    // جلب القواعد
    const rules = dto.ruleId
      ? await this.prisma.core_reconciliation_rules.findMany({
          where: { id: dto.ruleId, businessId, isActive: true },
        })
      : await this.prisma.core_reconciliation_rules.findMany({
          where: { businessId, isActive: true },
          orderBy: { priority: 'asc' },
        });

    if (rules.length === 0) {
      throw new BadRequestException('لا توجد قواعد تسوية نشطة');
    }

    // جلب القيود غير المسواة
    const pendingEntries = await this.prisma.core_clearing_entries.findMany({
      where: { status: 'pending' },
      include: { clearingAccount: true },
    });

    let matchedCount = 0;

    // تطبيق القواعد
    for (const rule of rules) {
      const matchFields = rule.matchFields as string[];
      const tolerance = rule.tolerance as { amount?: number; dateDays?: number } | null;

      // تجميع القيود حسب حقول المطابقة
      const groups = new Map<string, typeof pendingEntries>();

      for (const entry of pendingEntries) {
        if (entry.status !== 'pending') continue;

        const key = matchFields
          .map(field => {
            if (field === 'reference_number') return entry.referenceNumber;
            if (field === 'amount') return Math.abs(Number(entry.amount)).toString();
            if (field === 'date') return entry.entryDate.toISOString().split('T')[0];
            return '';
          })
          .join('|');

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(entry);
      }

      // البحث عن مطابقات
      for (const [, entries] of groups) {
        if (entries.length < 2) continue;

        const debits = entries.filter(e => Number(e.amount) > 0);
        const credits = entries.filter(e => Number(e.amount) < 0);

        if (debits.length > 0 && credits.length > 0) {
          const debitTotal = debits.reduce((sum, e) => sum + Number(e.amount), 0);
          const creditTotal = credits.reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

          const diff = Math.abs(debitTotal - creditTotal);
          const toleranceAmount = tolerance?.amount || 0;

          if (diff <= toleranceAmount) {
            // إنشاء مطابقة
            await this.createMatch(businessId, userId, {
              reconciliationId: dto.reconciliationId,
              sourceEntryIds: debits.map(e => e.id),
              targetEntryIds: credits.map(e => e.id),
              notes: `مطابقة تلقائية - قاعدة: ${rule.name}`,
            });
            matchedCount++;
          }
        }
      }
    }

    return { matchedCount };
  }

  // ==================== Allocations ====================

  async createAllocation(businessId: string, userId: string, dto: CreateAllocationDto) {
    const reconciliation = await this.findById(dto.reconciliationId, businessId);

    if (reconciliation.status === 'finalized') {
      throw new BadRequestException('لا يمكن إضافة توزيع لتسوية مكتملة');
    }

    const allocation = await this.prisma.core_reconciliation_allocations.create({
      data: {
        reconciliationId: dto.reconciliationId,
        clearingEntryId: dto.clearingEntryId,
        targetAccountId: dto.targetAccountId,
        amount: dto.amount,
      },
    });

    // تحديث حالة القيد
    await this.prisma.core_clearing_entries.update({
      where: { id: dto.clearingEntryId },
      data: { status: 'allocated' },
    });

    return allocation;
  }

  // ==================== Exceptions ====================

  async findExceptions(reconciliationId: string, businessId: string) {
    await this.findById(reconciliationId, businessId);

    return this.prisma.core_reconciliation_exceptions.findMany({
      where: { reconciliationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveException(id: string, businessId: string, userId: string, dto: ResolveExceptionDto) {
    const exception = await this.prisma.core_reconciliation_exceptions.findFirst({
      where: { id },
      include: { reconciliation: true },
    });

    if (!exception) {
      throw new NotFoundException('الاستثناء غير موجود');
    }

    if (exception.reconciliation.businessId !== businessId) {
      throw new NotFoundException('الاستثناء غير موجود');
    }

    return this.prisma.core_reconciliation_exceptions.update({
      where: { id },
      data: {
        resolved: true,
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolution: dto.resolution,
      },
    });
  }

  // ==================== Statistics ====================

  async getStatistics(businessId: string) {
    const [total, byStatus, byType] = await Promise.all([
      this.prisma.core_reconciliations.count({ where: { businessId } }),
      this.prisma.core_reconciliations.groupBy({
        by: ['status'],
        where: { businessId },
        _count: true,
      }),
      this.prisma.core_reconciliations.groupBy({
        by: ['type'],
        where: { businessId },
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // ==================== Helper Methods ====================

  private async updateReconciliationStats(reconciliationId: string) {
    const matches = await this.prisma.core_reconciliation_matches.findMany({
      where: { reconciliationId },
    });

    const totalItems = matches.length;
    const matchedAmount = matches.reduce((sum, m) => sum + Number(m.amount), 0);

    await this.prisma.core_reconciliations.update({
      where: { id: reconciliationId },
      data: {
        matchedItems: totalItems,
        matchedAmount,
      },
    });
  }
}
