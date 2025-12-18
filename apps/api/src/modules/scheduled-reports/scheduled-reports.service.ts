import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportsService } from '../reports/reports.service';

export interface CreateScheduleDto {
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  time: string; // HH:MM
  recipients: string[]; // قائمة البريد الإلكتروني
  parameters?: Record<string, any>;
}

export interface UpdateScheduleDto {
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  time?: string;
  recipients?: string[];
  parameters?: Record<string, any>;
  isActive?: boolean;
}

@Injectable()
export class ScheduledReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
  ) {}

  /**
   * الحصول على جميع الجداول
   */
  async findAll(businessId: string) {
    return this.prisma.core_report_schedules.findMany({
      where: { businessId },
      include: {
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * الحصول على جدول محدد
   */
  async findOne(id: string, businessId: string) {
    const schedule = await this.prisma.core_report_schedules.findFirst({
      where: { id, businessId },
      include: {
        template: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('الجدول غير موجود');
    }

    return schedule;
  }

  /**
   * إنشاء جدول جديد
   */
  async create(businessId: string, dto: CreateScheduleDto) {
    // التحقق من وجود القالب
    const template = await this.prisma.core_report_templates.findFirst({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException('قالب التقرير غير موجود');
    }

    // التحقق من صحة البيانات
    this.validateScheduleData(dto);

    // حساب موعد التشغيل التالي
    const nextRun = this.calculateNextRun(dto);

    return this.prisma.core_report_schedules.create({
      data: {
        businessId,
        templateId: dto.templateId,
        frequency: dto.frequency,
        dayOfMonth: dto.dayOfMonth,
        dayOfWeek: dto.dayOfWeek,
        time: dto.time,
        recipients: dto.recipients,
        parameters: dto.parameters || {},
        nextRun,
        isActive: true,
      },
      include: {
        template: true,
      },
    });
  }

  /**
   * تحديث جدول
   */
  async update(id: string, businessId: string, dto: UpdateScheduleDto) {
    const schedule = await this.findOne(id, businessId);

    // التحقق من صحة البيانات
    if (dto.frequency || dto.dayOfMonth || dto.dayOfWeek || dto.time) {
      this.validateScheduleData({
        ...schedule,
        ...dto,
        templateId: schedule.templateId,
        recipients: dto.recipients || (schedule.recipients as string[]),
      } as CreateScheduleDto);
    }

    // إعادة حساب موعد التشغيل التالي إذا تغيرت الإعدادات
    let nextRun = schedule.nextRun;
    if (dto.frequency || dto.dayOfMonth || dto.dayOfWeek || dto.time) {
      nextRun = this.calculateNextRun({
        frequency: dto.frequency || schedule.frequency,
        dayOfMonth: dto.dayOfMonth ?? schedule.dayOfMonth ?? undefined,
        dayOfWeek: dto.dayOfWeek ?? schedule.dayOfWeek ?? undefined,
        time: dto.time || schedule.time,
      } as CreateScheduleDto);
    }

    return this.prisma.core_report_schedules.update({
      where: { id },
      data: {
        ...dto,
        nextRun,
        updatedAt: new Date(),
      },
      include: {
        template: true,
      },
    });
  }

  /**
   * حذف جدول
   */
  async delete(id: string, businessId: string) {
    await this.findOne(id, businessId);

    return this.prisma.core_report_schedules.delete({
      where: { id },
    });
  }

  /**
   * تفعيل/تعطيل جدول
   */
  async toggleActive(id: string, businessId: string) {
    const schedule = await this.findOne(id, businessId);

    return this.prisma.core_report_schedules.update({
      where: { id },
      data: {
        isActive: !schedule.isActive,
        updatedAt: new Date(),
      },
      include: {
        template: true,
      },
    });
  }

  /**
   * تشغيل يدوي للجدول
   */
  async runNow(id: string, businessId: string) {
    const schedule = await this.findOne(id, businessId);

    // توليد التقرير
    const report = await this.generateReport(schedule);

    // تحديث آخر تشغيل
    await this.prisma.core_report_schedules.update({
      where: { id },
      data: {
        lastRun: new Date(),
        nextRun: this.calculateNextRun({
          frequency: schedule.frequency,
          dayOfMonth: schedule.dayOfMonth ?? undefined,
          dayOfWeek: schedule.dayOfWeek ?? undefined,
          time: schedule.time,
        } as CreateScheduleDto),
      },
    });

    return {
      success: true,
      message: 'تم تشغيل التقرير بنجاح',
      report,
    };
  }

  /**
   * الحصول على قوالب التقارير المتاحة
   */
  async getAvailableTemplates(businessId: string) {
    return this.prisma.core_report_templates.findMany({
      where: {
        OR: [
          { businessId },
          { isSystem: true },
        ],
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * الحصول على سجل التشغيل
   */
  async getRunHistory(scheduleId: string, businessId: string) {
    await this.findOne(scheduleId, businessId);

    // يمكن إضافة جدول لسجل التشغيل في المستقبل
    // حالياً نعيد آخر تشغيل فقط
    const schedule = await this.prisma.core_report_schedules.findUnique({
      where: { id: scheduleId },
    });

    return {
      lastRun: schedule?.lastRun,
      nextRun: schedule?.nextRun,
    };
  }

  /**
   * التحقق من صحة بيانات الجدول
   */
  private validateScheduleData(dto: CreateScheduleDto) {
    // التحقق من الوقت
    if (!/^\d{2}:\d{2}$/.test(dto.time)) {
      throw new BadRequestException('صيغة الوقت غير صحيحة. استخدم HH:MM');
    }

    const [hours, minutes] = dto.time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new BadRequestException('الوقت غير صحيح');
    }

    // التحقق من يوم الأسبوع للجدول الأسبوعي
    if (dto.frequency === 'weekly') {
      if (dto.dayOfWeek === undefined || dto.dayOfWeek < 0 || dto.dayOfWeek > 6) {
        throw new BadRequestException('يجب تحديد يوم الأسبوع (0-6) للجدول الأسبوعي');
      }
    }

    // التحقق من يوم الشهر للجدول الشهري
    if (dto.frequency === 'monthly' || dto.frequency === 'quarterly' || dto.frequency === 'yearly') {
      if (dto.dayOfMonth === undefined || dto.dayOfMonth < 1 || dto.dayOfMonth > 28) {
        throw new BadRequestException('يجب تحديد يوم الشهر (1-28) للجدول الشهري/الربع سنوي/السنوي');
      }
    }

    // التحقق من المستلمين
    if (!dto.recipients || dto.recipients.length === 0) {
      throw new BadRequestException('يجب تحديد مستلم واحد على الأقل');
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of dto.recipients) {
      if (!emailRegex.test(email)) {
        throw new BadRequestException(`البريد الإلكتروني غير صحيح: ${email}`);
      }
    }
  }

  /**
   * حساب موعد التشغيل التالي
   */
  private calculateNextRun(dto: CreateScheduleDto): Date {
    const now = new Date();
    const [hours, minutes] = dto.time.split(':').map(Number);
    
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (dto.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly': {
        const currentDay = now.getDay();
        const targetDay = dto.dayOfWeek!;
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0 || (daysUntil === 0 && nextRun <= now)) {
          daysUntil += 7;
        }
        nextRun.setDate(now.getDate() + daysUntil);
        break;
      }

      case 'monthly':
        nextRun.setDate(dto.dayOfMonth!);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;

      case 'quarterly': {
        nextRun.setDate(dto.dayOfMonth!);
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const nextQuarterMonth = (currentQuarter + 1) * 3;
        nextRun.setMonth(nextQuarterMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 3);
        }
        break;
      }

      case 'yearly':
        nextRun.setMonth(0); // يناير
        nextRun.setDate(dto.dayOfMonth!);
        if (nextRun <= now) {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }
        break;
    }

    return nextRun;
  }

  /**
   * توليد التقرير
   */
  private async generateReport(schedule: any) {
    const template = schedule.template;
    const parameters = schedule.parameters || {};

    // تحديد نطاق التاريخ بناءً على التكرار
    const { startDate, endDate } = this.getDateRange(schedule.frequency);

    // توليد التقرير بناءً على نوع القالب
    switch (template.type) {
      case 'trial_balance':
        return this.reportsService.getTrialBalance(schedule.businessId, startDate, endDate);
      
      case 'income_statement':
        return this.reportsService.getIncomeStatement(schedule.businessId, startDate, endDate);
      
      case 'balance_sheet':
        return this.reportsService.getBalanceSheet(schedule.businessId, endDate);
      
      case 'cash_flow':
        return this.reportsService.getCashFlowStatement(schedule.businessId, startDate, endDate);
      
      default:
        throw new BadRequestException(`نوع التقرير غير مدعوم: ${template.type}`);
    }
  }

  /**
   * الحصول على نطاق التاريخ بناءً على التكرار
   */
  private getDateRange(frequency: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    const endDate = now;

    switch (frequency) {
      case 'daily':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        break;

      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;

      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case 'quarterly': {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      }

      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;

      default:
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    return { startDate, endDate };
  }

  /**
   * مهمة مجدولة لتشغيل التقارير
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledReports() {
    const now = new Date();

    // البحث عن الجداول المستحقة
    const dueSchedules = await this.prisma.core_report_schedules.findMany({
      where: {
        isActive: true,
        nextRun: {
          lte: now,
        },
      },
      include: {
        template: true,
      },
    });

    for (const schedule of dueSchedules) {
      try {
        // توليد التقرير
        await this.generateReport(schedule);

        // تحديث الجدول
        await this.prisma.core_report_schedules.update({
          where: { id: schedule.id },
          data: {
            lastRun: now,
            nextRun: this.calculateNextRun({
              frequency: schedule.frequency,
              dayOfMonth: schedule.dayOfMonth ?? undefined,
              dayOfWeek: schedule.dayOfWeek ?? undefined,
              time: schedule.time,
            } as CreateScheduleDto),
          },
        });

        console.log(`تم تشغيل التقرير المجدول: ${schedule.id}`);
      } catch (error) {
        console.error(`فشل تشغيل التقرير المجدول: ${schedule.id}`, error);
      }
    }
  }
}
