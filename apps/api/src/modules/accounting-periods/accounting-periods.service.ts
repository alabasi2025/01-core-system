import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePeriodDto {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdatePeriodDto {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AccountingPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * الحصول على جميع الفترات المحاسبية
   */
  async findAll(businessId: string) {
    const periods = await this.prisma.core_accounting_periods.findMany({
      where: { businessId },
      orderBy: { startDate: 'desc' },
    });

    // إضافة إحصائيات لكل فترة
    const periodsWithStats = await Promise.all(
      periods.map(async (period) => {
        const entriesCount = await this.prisma.core_journal_entries.count({
          where: {
            businessId,
            entryDate: {
              gte: period.startDate,
              lte: period.endDate,
            },
            deletedAt: null,
          },
        });

        const postedEntriesCount = await this.prisma.core_journal_entries.count({
          where: {
            businessId,
            status: 'posted',
            entryDate: {
              gte: period.startDate,
              lte: period.endDate,
            },
            deletedAt: null,
          },
        });

        return {
          ...period,
          entriesCount,
          postedEntriesCount,
          draftEntriesCount: entriesCount - postedEntriesCount,
        };
      })
    );

    return periodsWithStats;
  }

  /**
   * الحصول على فترة محاسبية واحدة
   */
  async findOne(businessId: string, id: string) {
    const period = await this.prisma.core_accounting_periods.findFirst({
      where: { id, businessId },
    });

    if (!period) {
      throw new NotFoundException('الفترة المحاسبية غير موجودة');
    }

    // إحصائيات الفترة
    const [entriesCount, postedEntriesCount, totalDebit, totalCredit] = await Promise.all([
      this.prisma.core_journal_entries.count({
        where: {
          businessId,
          entryDate: { gte: period.startDate, lte: period.endDate },
          deletedAt: null,
        },
      }),
      this.prisma.core_journal_entries.count({
        where: {
          businessId,
          status: 'posted',
          entryDate: { gte: period.startDate, lte: period.endDate },
          deletedAt: null,
        },
      }),
      this.prisma.core_journal_entries.aggregate({
        where: {
          businessId,
          status: 'posted',
          entryDate: { gte: period.startDate, lte: period.endDate },
          deletedAt: null,
        },
        _sum: { totalDebit: true },
      }),
      this.prisma.core_journal_entries.aggregate({
        where: {
          businessId,
          status: 'posted',
          entryDate: { gte: period.startDate, lte: period.endDate },
          deletedAt: null,
        },
        _sum: { totalCredit: true },
      }),
    ]);

    return {
      ...period,
      statistics: {
        entriesCount,
        postedEntriesCount,
        draftEntriesCount: entriesCount - postedEntriesCount,
        totalDebit: Number(totalDebit._sum.totalDebit || 0),
        totalCredit: Number(totalCredit._sum.totalCredit || 0),
      },
    };
  }

  /**
   * إنشاء فترة محاسبية جديدة
   */
  async create(businessId: string, dto: CreatePeriodDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // التحقق من صحة التواريخ
    if (startDate >= endDate) {
      throw new BadRequestException('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
    }

    // التحقق من عدم وجود تداخل مع فترات أخرى
    const overlapping = await this.prisma.core_accounting_periods.findFirst({
      where: {
        businessId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException(`يوجد تداخل مع الفترة: ${overlapping.name}`);
    }

    // التحقق من عدم تكرار الاسم
    const existing = await this.prisma.core_accounting_periods.findFirst({
      where: { businessId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException('اسم الفترة موجود مسبقاً');
    }

    return this.prisma.core_accounting_periods.create({
      data: {
        businessId,
        name: dto.name,
        startDate,
        endDate,
      },
    });
  }

  /**
   * تحديث فترة محاسبية
   */
  async update(businessId: string, id: string, dto: UpdatePeriodDto) {
    const period = await this.prisma.core_accounting_periods.findFirst({
      where: { id, businessId },
    });

    if (!period) {
      throw new NotFoundException('الفترة المحاسبية غير موجودة');
    }

    if (period.isClosed) {
      throw new BadRequestException('لا يمكن تعديل فترة مغلقة');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : period.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : period.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
    }

    // التحقق من عدم وجود تداخل
    if (dto.startDate || dto.endDate) {
      const overlapping = await this.prisma.core_accounting_periods.findFirst({
        where: {
          businessId,
          id: { not: id },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          ],
        },
      });

      if (overlapping) {
        throw new ConflictException(`يوجد تداخل مع الفترة: ${overlapping.name}`);
      }
    }

    return this.prisma.core_accounting_periods.update({
      where: { id },
      data: {
        name: dto.name,
        startDate: dto.startDate ? startDate : undefined,
        endDate: dto.endDate ? endDate : undefined,
      },
    });
  }

  /**
   * إغلاق فترة محاسبية
   */
  async close(businessId: string, id: string, userId: string) {
    const period = await this.prisma.core_accounting_periods.findFirst({
      where: { id, businessId },
    });

    if (!period) {
      throw new NotFoundException('الفترة المحاسبية غير موجودة');
    }

    if (period.isClosed) {
      throw new BadRequestException('الفترة مغلقة مسبقاً');
    }

    // التحقق من عدم وجود قيود مسودة
    const draftEntries = await this.prisma.core_journal_entries.count({
      where: {
        businessId,
        status: 'draft',
        entryDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
        deletedAt: null,
      },
    });

    if (draftEntries > 0) {
      throw new BadRequestException(`يوجد ${draftEntries} قيد مسودة يجب ترحيلها أو حذفها قبل إغلاق الفترة`);
    }

    return this.prisma.core_accounting_periods.update({
      where: { id },
      data: {
        isClosed: true,
        closedAt: new Date(),
        closedBy: userId,
      },
    });
  }

  /**
   * إعادة فتح فترة محاسبية
   */
  async reopen(businessId: string, id: string) {
    const period = await this.prisma.core_accounting_periods.findFirst({
      where: { id, businessId },
    });

    if (!period) {
      throw new NotFoundException('الفترة المحاسبية غير موجودة');
    }

    if (!period.isClosed) {
      throw new BadRequestException('الفترة مفتوحة مسبقاً');
    }

    return this.prisma.core_accounting_periods.update({
      where: { id },
      data: {
        isClosed: false,
        closedAt: null,
        closedBy: null,
      },
    });
  }

  /**
   * حذف فترة محاسبية
   */
  async delete(businessId: string, id: string) {
    const period = await this.prisma.core_accounting_periods.findFirst({
      where: { id, businessId },
    });

    if (!period) {
      throw new NotFoundException('الفترة المحاسبية غير موجودة');
    }

    // التحقق من عدم وجود قيود في الفترة
    const entriesCount = await this.prisma.core_journal_entries.count({
      where: {
        businessId,
        entryDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
        deletedAt: null,
      },
    });

    if (entriesCount > 0) {
      throw new BadRequestException(`لا يمكن حذف الفترة لوجود ${entriesCount} قيد مرتبط بها`);
    }

    return this.prisma.core_accounting_periods.delete({
      where: { id },
    });
  }

  /**
   * الحصول على الفترة الحالية
   */
  async getCurrentPeriod(businessId: string) {
    const today = new Date();
    
    const period = await this.prisma.core_accounting_periods.findFirst({
      where: {
        businessId,
        startDate: { lte: today },
        endDate: { gte: today },
        isClosed: false,
      },
    });

    return period;
  }

  /**
   * التحقق من أن التاريخ ضمن فترة مفتوحة
   */
  async validateDateInOpenPeriod(businessId: string, date: Date): Promise<boolean> {
    const period = await this.prisma.core_accounting_periods.findFirst({
      where: {
        businessId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (!period) {
      return true; // لا توجد فترة محددة، السماح بالإدخال
    }

    return !period.isClosed;
  }

  /**
   * إحصائيات الفترات المحاسبية
   */
  async getStatistics(businessId: string) {
    const [total, open, closed, currentPeriod] = await Promise.all([
      this.prisma.core_accounting_periods.count({ where: { businessId } }),
      this.prisma.core_accounting_periods.count({ where: { businessId, isClosed: false } }),
      this.prisma.core_accounting_periods.count({ where: { businessId, isClosed: true } }),
      this.getCurrentPeriod(businessId),
    ]);

    return {
      total,
      open,
      closed,
      currentPeriod: currentPeriod ? {
        id: currentPeriod.id,
        name: currentPeriod.name,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
      } : null,
    };
  }
}
