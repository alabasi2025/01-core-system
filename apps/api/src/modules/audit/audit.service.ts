import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  POST = 'POST',
  VOID = 'VOID',
}

export interface AuditLogData {
  userId: string;
  businessId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * تسجيل حدث في سجل التدقيق
   */
  async log(data: AuditLogData): Promise<void> {
    await this.prisma.core_audit_logs.create({
      data: {
        userId: data.userId,
        businessId: data.businessId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        description: data.description || null,
      },
    });
  }

  /**
   * تسجيل إنشاء سجل جديد
   */
  async logCreate(
    userId: string,
    businessId: string,
    entityType: string,
    entityId: string,
    newValue: Record<string, unknown>,
    description?: string,
  ): Promise<void> {
    await this.log({
      userId,
      businessId,
      action: AuditAction.CREATE,
      entityType,
      entityId,
      newValue,
      description: description || `إنشاء ${entityType} جديد`,
    });
  }

  /**
   * تسجيل تحديث سجل
   */
  async logUpdate(
    userId: string,
    businessId: string,
    entityType: string,
    entityId: string,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    description?: string,
  ): Promise<void> {
    await this.log({
      userId,
      businessId,
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      oldValue,
      newValue,
      description: description || `تحديث ${entityType}`,
    });
  }

  /**
   * تسجيل حذف ناعم
   */
  async logSoftDelete(
    userId: string,
    businessId: string,
    entityType: string,
    entityId: string,
    oldValue: Record<string, unknown>,
    description?: string,
  ): Promise<void> {
    await this.log({
      userId,
      businessId,
      action: AuditAction.SOFT_DELETE,
      entityType,
      entityId,
      oldValue,
      description: description || `حذف ${entityType} (ناعم)`,
    });
  }

  /**
   * تسجيل ترحيل قيد
   */
  async logPost(
    userId: string,
    businessId: string,
    entityType: string,
    entityId: string,
    newValue: Record<string, unknown>,
    description?: string,
  ): Promise<void> {
    await this.log({
      userId,
      businessId,
      action: AuditAction.POST,
      entityType,
      entityId,
      newValue,
      description: description || `ترحيل ${entityType}`,
    });
  }

  /**
   * تسجيل إلغاء قيد
   */
  async logVoid(
    userId: string,
    businessId: string,
    entityType: string,
    entityId: string,
    oldValue: Record<string, unknown>,
    description?: string,
  ): Promise<void> {
    await this.log({
      userId,
      businessId,
      action: AuditAction.VOID,
      entityType,
      entityId,
      oldValue,
      description: description || `إلغاء ${entityType}`,
    });
  }

  /**
   * الحصول على سجلات التدقيق لكيان معين
   */
  async getEntityAuditLogs(
    businessId: string,
    entityType: string,
    entityId: string,
  ) {
    return this.prisma.core_audit_logs.findMany({
      where: {
        businessId,
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * الحصول على سجلات التدقيق لمستخدم معين
   */
  async getUserAuditLogs(businessId: string, userId: string, limit = 50) {
    return this.prisma.core_audit_logs.findMany({
      where: {
        businessId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * الحصول على سجلات التدقيق للمجموعة
   */
  async getBusinessAuditLogs(
    businessId: string,
    options: {
      page?: number;
      limit?: number;
      action?: AuditAction;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const { page = 1, limit = 20, action, entityType, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { businessId };

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = startDate;
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.core_audit_logs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.core_audit_logs.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
