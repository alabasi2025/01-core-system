import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CreateNotificationDto {
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * إنشاء إشعار جديد
   */
  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.core_notifications.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        link: dto.link,
        metadata: dto.metadata || {},
        isRead: false,
      },
    });

    // إطلاق حدث للإشعار الجديد
    this.eventEmitter.emit('notification.created', notification);

    return notification;
  }

  /**
   * إنشاء إشعارات متعددة (لمجموعة مستخدمين)
   */
  async createBulk(userIds: string[], dto: Omit<CreateNotificationDto, 'userId'>) {
    const notifications = await this.prisma.core_notifications.createMany({
      data: userIds.map(userId => ({
        userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        link: dto.link,
        metadata: dto.metadata || {},
        isRead: false,
      })),
    });

    return notifications;
  }

  /**
   * جلب إشعارات المستخدم
   */
  async findAll(userId: string, filters: NotificationFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.core_notifications.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.core_notifications.count({ where }),
      this.prisma.core_notifications.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  /**
   * جلب إشعار واحد
   */
  async findById(id: string, userId: string) {
    const notification = await this.prisma.core_notifications.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    return notification;
  }

  /**
   * تحديد إشعار كمقروء
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.findById(id, userId);

    return this.prisma.core_notifications.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * تحديد جميع الإشعارات كمقروءة
   */
  async markAllAsRead(userId: string) {
    return this.prisma.core_notifications.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * حذف إشعار
   */
  async delete(id: string, userId: string) {
    await this.findById(id, userId);

    return this.prisma.core_notifications.delete({
      where: { id },
    });
  }

  /**
   * حذف الإشعارات القديمة (أكثر من 30 يوم)
   */
  async deleteOldNotifications(userId: string, daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.prisma.core_notifications.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });
  }

  /**
   * جلب عدد الإشعارات غير المقروءة
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.core_notifications.count({
      where: { userId, isRead: false },
    });
  }

  // ==================== إشعارات النظام التلقائية ====================

  /**
   * إشعار عند إنشاء قيد يومية جديد
   */
  async notifyJournalEntryCreated(entry: any, creatorId: string) {
    // إشعار للمدير المالي أو المراجع
    const managers = await this.getFinancialManagers(entry.businessId);
    
    for (const manager of managers) {
      if (manager.id !== creatorId) {
        await this.create({
          userId: manager.id,
          type: 'info',
          title: 'قيد يومية جديد',
          message: `تم إنشاء قيد يومية جديد برقم ${entry.entryNumber}`,
          link: `/journal-entries/${entry.id}`,
          metadata: { entryId: entry.id, entryNumber: entry.entryNumber },
        });
      }
    }
  }

  /**
   * إشعار عند اعتماد أمر دفع
   */
  async notifyPaymentOrderApproved(order: any, approverId: string) {
    await this.create({
      userId: order.createdById,
      type: 'success',
      title: 'تم اعتماد أمر الدفع',
      message: `تم اعتماد أمر الدفع رقم ${order.orderNumber}`,
      link: `/payment-orders/${order.id}`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });
  }

  /**
   * إشعار عند رفض أمر دفع
   */
  async notifyPaymentOrderRejected(order: any, reason: string) {
    await this.create({
      userId: order.createdById,
      type: 'error',
      title: 'تم رفض أمر الدفع',
      message: `تم رفض أمر الدفع رقم ${order.orderNumber}. السبب: ${reason}`,
      link: `/payment-orders/${order.id}`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, reason },
    });
  }

  /**
   * إشعار عند اقتراب موعد استحقاق أمر دفع
   */
  async notifyPaymentOrderDueSoon(order: any) {
    await this.create({
      userId: order.createdById,
      type: 'warning',
      title: 'أمر دفع قريب الاستحقاق',
      message: `أمر الدفع رقم ${order.orderNumber} سيستحق في ${new Date(order.dueDate).toLocaleDateString('ar-YE')}`,
      link: `/payment-orders/${order.id}`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });
  }

  /**
   * إشعار عند إغلاق فترة محاسبية
   */
  async notifyPeriodClosed(period: any, businessId: string) {
    const users = await this.getBusinessUsers(businessId);
    
    await this.createBulk(
      users.map(u => u.id),
      {
        type: 'info',
        title: 'إغلاق فترة محاسبية',
        message: `تم إغلاق الفترة المحاسبية ${period.name}`,
        link: `/accounting-periods`,
        metadata: { periodId: period.id, periodName: period.name },
      },
    );
  }

  /**
   * إشعار عند وجود تسويات معلقة
   */
  async notifyPendingReconciliations(userId: string, count: number, totalAmount: number) {
    await this.create({
      userId,
      type: 'warning',
      title: 'تسويات معلقة',
      message: `يوجد ${count} حساب وسيط بحاجة للتسوية بإجمالي ${totalAmount.toLocaleString('ar-YE')}`,
      link: `/reconciliation`,
      metadata: { count, totalAmount },
    });
  }

  // ==================== مساعدات ====================

  /**
   * جلب المدراء الماليين للمجموعة
   */
  private async getFinancialManagers(businessId: string) {
    return this.prisma.core_users.findMany({
      where: {
        businessId,
        isActive: true,
        userRoles: {
          some: {
            role: {
              rolePermissions: {
                some: {
                  permission: {
                    OR: [
                      { module: 'journal_entries', action: 'approve' },
                      { module: 'financial', action: 'manage' },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true, name: true, email: true },
    });
  }

  /**
   * جلب جميع مستخدمي المجموعة
   */
  private async getBusinessUsers(businessId: string) {
    return this.prisma.core_users.findMany({
      where: { businessId, isActive: true },
      select: { id: true },
    });
  }
}
