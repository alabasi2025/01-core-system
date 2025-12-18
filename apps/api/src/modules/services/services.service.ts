import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateServicePriceDto,
  UpdateServicePriceDto,
  CreateServiceTierDto,
  UpdateServiceTierDto,
  CalculatePriceDto,
} from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  // ==================== فئات الخدمات ====================

  async findAllCategories(businessId: string) {
    return this.prisma.core_service_categories.findMany({
      where: { businessId },
      include: {
        parent: true,
        children: true,
        _count: { select: { services: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findCategoryById(businessId: string, id: string) {
    const category = await this.prisma.core_service_categories.findFirst({
      where: { id, businessId },
      include: {
        parent: true,
        children: true,
        services: { where: { isActive: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('فئة الخدمة غير موجودة');
    }

    return category;
  }

  async createCategory(businessId: string, dto: CreateServiceCategoryDto) {
    // التحقق من عدم تكرار الكود
    const existing = await this.prisma.core_service_categories.findFirst({
      where: { businessId, code: dto.code },
    });

    if (existing) {
      throw new BadRequestException('كود الفئة موجود مسبقاً');
    }

    return this.prisma.core_service_categories.create({
      data: {
        businessId,
        ...dto,
      },
      include: { parent: true },
    });
  }

  async updateCategory(businessId: string, id: string, dto: UpdateServiceCategoryDto) {
    const category = await this.findCategoryById(businessId, id);

    // التحقق من عدم تكرار الكود
    if (dto.code && dto.code !== category.code) {
      const existing = await this.prisma.core_service_categories.findFirst({
        where: { businessId, code: dto.code, NOT: { id } },
      });

      if (existing) {
        throw new BadRequestException('كود الفئة موجود مسبقاً');
      }
    }

    return this.prisma.core_service_categories.update({
      where: { id },
      data: dto,
      include: { parent: true },
    });
  }

  async deleteCategory(businessId: string, id: string) {
    const category = await this.findCategoryById(businessId, id);

    // التحقق من عدم وجود خدمات مرتبطة
    const servicesCount = await this.prisma.core_services.count({
      where: { categoryId: id },
    });

    if (servicesCount > 0) {
      throw new BadRequestException('لا يمكن حذف الفئة لوجود خدمات مرتبطة بها');
    }

    // التحقق من عدم وجود فئات فرعية
    const childrenCount = await this.prisma.core_service_categories.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException('لا يمكن حذف الفئة لوجود فئات فرعية');
    }

    return this.prisma.core_service_categories.delete({ where: { id } });
  }

  async getCategoriesTree(businessId: string) {
    const categories = await this.prisma.core_service_categories.findMany({
      where: { businessId, parentId: null },
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { services: true } },
          },
        },
        _count: { select: { services: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories;
  }

  // ==================== الخدمات ====================

  async findAllServices(businessId: string, filters?: {
    categoryId?: string;
    serviceType?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const where: any = { businessId };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.serviceType) {
      where.serviceType = filters.serviceType;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { nameEn: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.core_services.findMany({
      where,
      include: {
        category: true,
        revenueAccount: true,
        _count: { select: { prices: true, tiers: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findServiceById(businessId: string, id: string) {
    const service = await this.prisma.core_services.findFirst({
      where: { id, businessId },
      include: {
        category: true,
        revenueAccount: true,
        prices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: 'desc' },
        },
        tiers: {
          where: { isActive: true },
          orderBy: [{ fromQuantity: 'asc' }],
        },
      },
    });

    if (!service) {
      throw new NotFoundException('الخدمة غير موجودة');
    }

    return service;
  }

  async createService(businessId: string, dto: CreateServiceDto) {
    // التحقق من عدم تكرار الكود
    const existing = await this.prisma.core_services.findFirst({
      where: { businessId, code: dto.code },
    });

    if (existing) {
      throw new BadRequestException('كود الخدمة موجود مسبقاً');
    }

    // التحقق من وجود الفئة
    if (dto.categoryId) {
      const category = await this.prisma.core_service_categories.findFirst({
        where: { id: dto.categoryId, businessId },
      });

      if (!category) {
        throw new BadRequestException('فئة الخدمة غير موجودة');
      }
    }

    // التحقق من وجود حساب الإيرادات
    if (dto.revenueAccountId) {
      const account = await this.prisma.core_accounts.findFirst({
        where: { id: dto.revenueAccountId, businessId },
      });

      if (!account) {
        throw new BadRequestException('حساب الإيرادات غير موجود');
      }
    }

    return this.prisma.core_services.create({
      data: {
        businessId,
        ...dto,
      },
      include: { category: true, revenueAccount: true },
    });
  }

  async updateService(businessId: string, id: string, dto: UpdateServiceDto) {
    const service = await this.findServiceById(businessId, id);

    // التحقق من عدم تكرار الكود
    if (dto.code && dto.code !== service.code) {
      const existing = await this.prisma.core_services.findFirst({
        where: { businessId, code: dto.code, NOT: { id } },
      });

      if (existing) {
        throw new BadRequestException('كود الخدمة موجود مسبقاً');
      }
    }

    return this.prisma.core_services.update({
      where: { id },
      data: dto,
      include: { category: true, revenueAccount: true },
    });
  }

  async deleteService(businessId: string, id: string) {
    await this.findServiceById(businessId, id);

    // حذف الأسعار والشرائح المرتبطة
    await this.prisma.core_service_prices.deleteMany({ where: { serviceId: id } });
    await this.prisma.core_service_tiers.deleteMany({ where: { serviceId: id } });

    return this.prisma.core_services.delete({ where: { id } });
  }

  // ==================== أسعار الخدمات ====================

  async findServicePrices(businessId: string, serviceId: string) {
    // التحقق من وجود الخدمة
    await this.findServiceById(businessId, serviceId);

    return this.prisma.core_service_prices.findMany({
      where: { serviceId },
      orderBy: [{ effectiveFrom: 'desc' }, { customerType: 'asc' }],
    });
  }

  async createServicePrice(businessId: string, dto: CreateServicePriceDto) {
    // التحقق من وجود الخدمة
    await this.findServiceById(businessId, dto.serviceId);

    return this.prisma.core_service_prices.create({
      data: {
        ...dto,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
  }

  async updateServicePrice(businessId: string, id: string, dto: UpdateServicePriceDto) {
    const price = await this.prisma.core_service_prices.findFirst({
      where: { id },
      include: { service: true },
    });

    if (!price || price.service.businessId !== businessId) {
      throw new NotFoundException('السعر غير موجود');
    }

    return this.prisma.core_service_prices.update({
      where: { id },
      data: {
        ...dto,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
    });
  }

  async deleteServicePrice(businessId: string, id: string) {
    const price = await this.prisma.core_service_prices.findFirst({
      where: { id },
      include: { service: true },
    });

    if (!price || price.service.businessId !== businessId) {
      throw new NotFoundException('السعر غير موجود');
    }

    return this.prisma.core_service_prices.delete({ where: { id } });
  }

  // ==================== شرائح التسعير ====================

  async findServiceTiers(businessId: string, serviceId: string) {
    // التحقق من وجود الخدمة
    await this.findServiceById(businessId, serviceId);

    return this.prisma.core_service_tiers.findMany({
      where: { serviceId },
      orderBy: [{ fromQuantity: 'asc' }],
    });
  }

  async createServiceTier(businessId: string, dto: CreateServiceTierDto) {
    // التحقق من وجود الخدمة
    await this.findServiceById(businessId, dto.serviceId);

    return this.prisma.core_service_tiers.create({
      data: {
        ...dto,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
  }

  async updateServiceTier(businessId: string, id: string, dto: UpdateServiceTierDto) {
    const tier = await this.prisma.core_service_tiers.findFirst({
      where: { id },
      include: { service: true },
    });

    if (!tier || tier.service.businessId !== businessId) {
      throw new NotFoundException('الشريحة غير موجودة');
    }

    return this.prisma.core_service_tiers.update({
      where: { id },
      data: {
        ...dto,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
    });
  }

  async deleteServiceTier(businessId: string, id: string) {
    const tier = await this.prisma.core_service_tiers.findFirst({
      where: { id },
      include: { service: true },
    });

    if (!tier || tier.service.businessId !== businessId) {
      throw new NotFoundException('الشريحة غير موجودة');
    }

    return this.prisma.core_service_tiers.delete({ where: { id } });
  }

  // ==================== حساب السعر ====================

  async calculatePrice(businessId: string, dto: CalculatePriceDto) {
    const service = await this.findServiceById(businessId, dto.serviceId);
    const date = dto.date ? new Date(dto.date) : new Date();

    let totalPrice = 0;
    let breakdown: any[] = [];

    // التحقق من نوع التسعير
    if (service.serviceType === 'consumption') {
      // تسعير متدرج (شرائح)
      const tiers = await this.prisma.core_service_tiers.findMany({
        where: {
          serviceId: dto.serviceId,
          isActive: true,
          effectiveFrom: { lte: date },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: date } },
          ],
          ...(dto.customerType && { customerType: dto.customerType }),
        },
        orderBy: { fromQuantity: 'asc' },
      });

      if (tiers.length > 0) {
        let remainingQuantity = dto.quantity;

        for (const tier of tiers) {
          if (remainingQuantity <= 0) break;

          const tierFrom = Number(tier.fromQuantity);
          const tierTo = tier.toQuantity ? Number(tier.toQuantity) : Infinity;
          const pricePerUnit = Number(tier.pricePerUnit);
          const fixedCharge = Number(tier.fixedCharge || 0);

          if (dto.quantity > tierFrom) {
            const tierQuantity = Math.min(
              remainingQuantity,
              tierTo - tierFrom
            );

            if (tierQuantity > 0) {
              const tierTotal = tierQuantity * pricePerUnit + fixedCharge;
              totalPrice += tierTotal;

              breakdown.push({
                tierName: tier.tierName,
                from: tierFrom,
                to: tierTo === Infinity ? null : tierTo,
                quantity: tierQuantity,
                pricePerUnit,
                fixedCharge,
                total: tierTotal,
              });

              remainingQuantity -= tierQuantity;
            }
          }
        }
      }
    } else {
      // سعر ثابت أو لكل وحدة
      const price = await this.prisma.core_service_prices.findFirst({
        where: {
          serviceId: dto.serviceId,
          isActive: true,
          effectiveFrom: { lte: date },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: date } },
          ],
          ...(dto.customerType && { customerType: dto.customerType }),
          ...(dto.stationId && { stationId: dto.stationId }),
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (price) {
        const priceValue = Number(price.price);

        if (price.priceType === 'fixed') {
          totalPrice = priceValue;
        } else if (price.priceType === 'per_unit') {
          totalPrice = priceValue * dto.quantity;
        } else if (price.priceType === 'percentage') {
          totalPrice = (priceValue / 100) * dto.quantity;
        }

        breakdown.push({
          priceType: price.priceType,
          price: priceValue,
          quantity: dto.quantity,
          total: totalPrice,
        });
      }
    }

    // حساب الضريبة
    let taxAmount = 0;
    if (service.isTaxable && service.taxRate) {
      taxAmount = totalPrice * (Number(service.taxRate) / 100);
    }

    return {
      service: {
        id: service.id,
        code: service.code,
        name: service.name,
        serviceType: service.serviceType,
      },
      quantity: dto.quantity,
      customerType: dto.customerType,
      subtotal: totalPrice,
      taxRate: service.taxRate ? Number(service.taxRate) : 0,
      taxAmount,
      total: totalPrice + taxAmount,
      breakdown,
    };
  }

  // ==================== الإحصائيات ====================

  async getStatistics(businessId: string) {
    const [
      categoriesCount,
      servicesCount,
      activeServicesCount,
      pricesCount,
      tiersCount,
    ] = await Promise.all([
      this.prisma.core_service_categories.count({ where: { businessId } }),
      this.prisma.core_services.count({ where: { businessId } }),
      this.prisma.core_services.count({ where: { businessId, isActive: true } }),
      this.prisma.core_service_prices.count({
        where: { service: { businessId } },
      }),
      this.prisma.core_service_tiers.count({
        where: { service: { businessId } },
      }),
    ]);

    const servicesByType = await this.prisma.core_services.groupBy({
      by: ['serviceType'],
      where: { businessId },
      _count: true,
    });

    return {
      categories: categoriesCount,
      services: {
        total: servicesCount,
        active: activeServicesCount,
        inactive: servicesCount - activeServicesCount,
      },
      prices: pricesCount,
      tiers: tiersCount,
      byType: servicesByType.map((s) => ({
        type: s.serviceType,
        count: s._count,
      })),
    };
  }

  // ==================== Seed البيانات الافتراضية ====================

  async seedDefaultServices(businessId: string) {
    // إنشاء فئات الخدمات الافتراضية
    const categories = [
      { code: 'ELEC', name: 'خدمات الكهرباء', nameEn: 'Electricity Services', sortOrder: 1 },
      { code: 'FEES', name: 'الرسوم والغرامات', nameEn: 'Fees & Penalties', sortOrder: 2 },
      { code: 'CONN', name: 'خدمات التوصيل', nameEn: 'Connection Services', sortOrder: 3 },
      { code: 'MAINT', name: 'خدمات الصيانة', nameEn: 'Maintenance Services', sortOrder: 4 },
    ];

    const createdCategories: any = {};

    for (const cat of categories) {
      const existing = await this.prisma.core_service_categories.findFirst({
        where: { businessId, code: cat.code },
      });

      if (!existing) {
        const created = await this.prisma.core_service_categories.create({
          data: { businessId, ...cat },
        });
        createdCategories[cat.code] = created.id;
      } else {
        createdCategories[cat.code] = existing.id;
      }
    }

    // إنشاء الخدمات الافتراضية
    const services = [
      {
        code: 'ELEC-CONS',
        name: 'استهلاك الكهرباء',
        nameEn: 'Electricity Consumption',
        categoryId: createdCategories['ELEC'],
        serviceType: 'consumption',
        unit: 'kWh',
        requiresMeter: true,
      },
      {
        code: 'ELEC-SUB',
        name: 'اشتراك شهري',
        nameEn: 'Monthly Subscription',
        categoryId: createdCategories['ELEC'],
        serviceType: 'recurring',
        unit: 'شهر',
      },
      {
        code: 'CONN-NEW',
        name: 'رسوم توصيل جديد',
        nameEn: 'New Connection Fee',
        categoryId: createdCategories['CONN'],
        serviceType: 'one_time',
      },
      {
        code: 'CONN-RECON',
        name: 'رسوم إعادة توصيل',
        nameEn: 'Reconnection Fee',
        categoryId: createdCategories['CONN'],
        serviceType: 'one_time',
      },
      {
        code: 'FEES-LATE',
        name: 'غرامة تأخير',
        nameEn: 'Late Payment Penalty',
        categoryId: createdCategories['FEES'],
        serviceType: 'one_time',
        isTaxable: false,
      },
      {
        code: 'FEES-DISC',
        name: 'رسوم فصل الخدمة',
        nameEn: 'Disconnection Fee',
        categoryId: createdCategories['FEES'],
        serviceType: 'one_time',
      },
      {
        code: 'MAINT-METER',
        name: 'صيانة العداد',
        nameEn: 'Meter Maintenance',
        categoryId: createdCategories['MAINT'],
        serviceType: 'one_time',
      },
      {
        code: 'PREPAID',
        name: 'شحن رصيد مسبق',
        nameEn: 'Prepaid Credit',
        categoryId: createdCategories['ELEC'],
        serviceType: 'prepaid',
        unit: 'kWh',
      },
    ];

    let created = 0;
    let updated = 0;

    for (const svc of services) {
      const existing = await this.prisma.core_services.findFirst({
        where: { businessId, code: svc.code },
      });

      if (!existing) {
        await this.prisma.core_services.create({
          data: { businessId, ...svc } as any,
        });
        created++;
      } else {
        updated++;
      }
    }

    // إنشاء شرائح التسعير للاستهلاك
    const consumptionService = await this.prisma.core_services.findFirst({
      where: { businessId, code: 'ELEC-CONS' },
    });

    if (consumptionService) {
      const existingTiers = await this.prisma.core_service_tiers.count({
        where: { serviceId: consumptionService.id },
      });

      if (existingTiers === 0) {
        const tiers = [
          { tierName: 'الشريحة الأولى (0-100)', fromQuantity: 0, toQuantity: 100, pricePerUnit: 0.05, fixedCharge: 0 },
          { tierName: 'الشريحة الثانية (101-200)', fromQuantity: 100, toQuantity: 200, pricePerUnit: 0.08, fixedCharge: 0 },
          { tierName: 'الشريحة الثالثة (201-500)', fromQuantity: 200, toQuantity: 500, pricePerUnit: 0.12, fixedCharge: 0 },
          { tierName: 'الشريحة الرابعة (501+)', fromQuantity: 500, toQuantity: null, pricePerUnit: 0.15, fixedCharge: 0 },
        ];

        for (const tier of tiers) {
          await this.prisma.core_service_tiers.create({
            data: {
              serviceId: consumptionService.id,
              ...tier,
              effectiveFrom: new Date('2025-01-01'),
            },
          });
        }
      }
    }

    return {
      message: 'تم إنشاء الخدمات الافتراضية بنجاح',
      categories: Object.keys(createdCategories).length,
      services: { created, updated },
    };
  }
}
