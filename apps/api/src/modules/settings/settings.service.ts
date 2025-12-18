import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSettingDto, UpdateSettingDto, DEFAULT_SETTINGS } from './dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * الحصول على جميع الإعدادات لمجموعة معينة
   */
  async findAll(businessId: string, category?: string) {
    const where: any = { businessId };
    if (category) {
      where.category = category;
    }

    const settings = await this.prisma.core_settings.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // تحويل إلى كائن مُنظم
    const result: Record<string, Record<string, any>> = {};
    for (const setting of settings) {
      if (!result[setting.category]) {
        result[setting.category] = {};
      }
      result[setting.category][setting.key] = setting.value;
    }

    return result;
  }

  /**
   * الحصول على إعداد معين
   */
  async findOne(businessId: string, key: string) {
    const setting = await this.prisma.core_settings.findFirst({
      where: { businessId, key },
    });

    if (!setting) {
      // إرجاع القيمة الافتراضية إن وجدت
      for (const category of Object.values(DEFAULT_SETTINGS)) {
        if (key in category) {
          return (category as any)[key].value;
        }
      }
      throw new NotFoundException(`الإعداد ${key} غير موجود`);
    }

    return setting.value;
  }

  /**
   * إنشاء أو تحديث إعداد
   */
  async upsert(businessId: string, dto: CreateSettingDto) {
    const existing = await this.prisma.core_settings.findFirst({
      where: {
        businessId,
        stationId: dto.stationId || null,
        key: dto.key,
      },
    });

    if (existing) {
      return this.prisma.core_settings.update({
        where: { id: existing.id },
        data: { value: dto.value },
      });
    }

    return this.prisma.core_settings.create({
      data: {
        businessId,
        stationId: dto.stationId,
        key: dto.key,
        value: dto.value,
        category: dto.category,
      },
    });
  }

  /**
   * تحديث إعداد معين
   */
  async update(businessId: string, key: string, dto: UpdateSettingDto) {
    const setting = await this.prisma.core_settings.findFirst({
      where: { businessId, key },
    });

    if (!setting) {
      throw new NotFoundException(`الإعداد ${key} غير موجود`);
    }

    return this.prisma.core_settings.update({
      where: { id: setting.id },
      data: { value: dto.value },
    });
  }

  /**
   * تحديث مجموعة إعدادات دفعة واحدة
   */
  async bulkUpdate(businessId: string, settings: CreateSettingDto[]) {
    const results = [];
    for (const setting of settings) {
      const result = await this.upsert(businessId, setting);
      results.push(result);
    }
    return results;
  }

  /**
   * حذف إعداد
   */
  async remove(businessId: string, key: string) {
    const setting = await this.prisma.core_settings.findFirst({
      where: { businessId, key },
    });

    if (!setting) {
      throw new NotFoundException(`الإعداد ${key} غير موجود`);
    }

    await this.prisma.core_settings.delete({
      where: { id: setting.id },
    });

    return { message: 'تم حذف الإعداد بنجاح' };
  }

  /**
   * إعادة تعيين الإعدادات للقيم الافتراضية
   */
  async resetToDefaults(businessId: string, category?: string) {
    // حذف الإعدادات الحالية
    const where: any = { businessId };
    if (category) {
      where.category = category;
    }
    await this.prisma.core_settings.deleteMany({ where });

    // إنشاء الإعدادات الافتراضية
    const settingsToCreate: any[] = [];
    const categories = category 
      ? { [category]: (DEFAULT_SETTINGS as any)[category] }
      : DEFAULT_SETTINGS;

    for (const [cat, settings] of Object.entries(categories)) {
      if (!settings) continue;
      for (const [key, config] of Object.entries(settings as Record<string, any>)) {
        settingsToCreate.push({
          businessId,
          key,
          value: config.value,
          category: cat,
        });
      }
    }

    if (settingsToCreate.length > 0) {
      await this.prisma.core_settings.createMany({
        data: settingsToCreate,
      });
    }

    return { message: 'تم إعادة تعيين الإعدادات بنجاح', count: settingsToCreate.length };
  }

  /**
   * الحصول على الإعدادات الافتراضية
   */
  getDefaultSettings() {
    return DEFAULT_SETTINGS;
  }

  /**
   * الحصول على إعدادات محطة معينة
   */
  async getStationSettings(businessId: string, stationId: string) {
    const settings = await this.prisma.core_settings.findMany({
      where: { businessId, stationId },
      orderBy: { key: 'asc' },
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result;
  }

  /**
   * تحديث إعدادات محطة
   */
  async updateStationSettings(businessId: string, stationId: string, settings: Record<string, any>) {
    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      const result = await this.upsert(businessId, {
        businessId,
        stationId,
        key,
        value,
        category: 'station',
      });
      results.push(result);
    }
    return results;
  }
}
