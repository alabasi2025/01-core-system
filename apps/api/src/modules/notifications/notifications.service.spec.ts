import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    core_notifications: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockEventEmitter = {
    on: jest.fn(),
    emit: jest.fn(),
  };

  const mockUserId = 'user-123';
  const mockNotification = {
    id: 'notif-1',
    userId: mockUserId,
    type: 'info',
    title: 'إشعار تجريبي',
    message: 'هذا إشعار تجريبي للاختبار',
    link: '/test',
    isRead: false,
    readAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('يجب إنشاء إشعار جديد بنجاح', async () => {
      mockPrismaService.core_notifications.create.mockResolvedValue(mockNotification);

      const result = await service.create({
        userId: mockUserId,
        type: 'info',
        title: 'إشعار تجريبي',
        message: 'هذا إشعار تجريبي للاختبار',
        link: '/test',
      });

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.core_notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          type: 'info',
          title: 'إشعار تجريبي',
          message: 'هذا إشعار تجريبي للاختبار',
          link: '/test',
        }),
      });
    });

    it('يجب إنشاء إشعار بدون رابط', async () => {
      const notificationWithoutLink = { ...mockNotification, link: null };
      mockPrismaService.core_notifications.create.mockResolvedValue(notificationWithoutLink);

      const result = await service.create({
        userId: mockUserId,
        type: 'warning',
        title: 'تحذير',
        message: 'رسالة تحذيرية',
      });

      expect(result.link).toBeNull();
    });
  });

  describe('findAll', () => {
    it('يجب جلب جميع الإشعارات مع الترقيم', async () => {
      const notifications = [mockNotification, { ...mockNotification, id: 'notif-2' }];
      mockPrismaService.core_notifications.findMany.mockResolvedValue(notifications);
      mockPrismaService.core_notifications.count.mockResolvedValue(2);

      const result = await service.findAll(mockUserId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('يجب تصفية الإشعارات حسب النوع', async () => {
      mockPrismaService.core_notifications.findMany.mockResolvedValue([mockNotification]);
      mockPrismaService.core_notifications.count.mockResolvedValue(1);

      await service.findAll(mockUserId, { type: 'info' });

      expect(mockPrismaService.core_notifications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'info',
          }),
        }),
      );
    });

    it('يجب تصفية الإشعارات غير المقروءة فقط', async () => {
      mockPrismaService.core_notifications.findMany.mockResolvedValue([mockNotification]);
      mockPrismaService.core_notifications.count.mockResolvedValue(1);

      await service.findAll(mockUserId, { isRead: false });

      expect(mockPrismaService.core_notifications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('يجب جلب إشعار واحد بنجاح', async () => {
      mockPrismaService.core_notifications.findFirst.mockResolvedValue(mockNotification);

      const result = await service.findById('notif-1', mockUserId);

      expect(result).toEqual(mockNotification);
    });

    it('يجب رمي استثناء عند عدم وجود الإشعار', async () => {
      mockPrismaService.core_notifications.findFirst.mockResolvedValue(null);

      await expect(service.findById('invalid-id', mockUserId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('يجب تحديد الإشعار كمقروء', async () => {
      mockPrismaService.core_notifications.findFirst.mockResolvedValue(mockNotification);
      mockPrismaService.core_notifications.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      });

      const result = await service.markAsRead('notif-1', mockUserId);

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
    });

    it('يجب رمي استثناء عند محاولة تحديد إشعار غير موجود', async () => {
      mockPrismaService.core_notifications.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('invalid-id', mockUserId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('يجب تحديد جميع الإشعارات كمقروءة', async () => {
      mockPrismaService.core_notifications.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(mockUserId);

      expect(result.count).toBe(5);
      expect(mockPrismaService.core_notifications.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('يجب إرجاع عدد الإشعارات غير المقروءة', async () => {
      mockPrismaService.core_notifications.count.mockResolvedValue(10);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toBe(10);
      expect(mockPrismaService.core_notifications.count).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          isRead: false,
        },
      });
    });
  });

  describe('delete', () => {
    it('يجب حذف الإشعار بنجاح', async () => {
      mockPrismaService.core_notifications.findFirst.mockResolvedValue(mockNotification);
      mockPrismaService.core_notifications.delete.mockResolvedValue(mockNotification);

      await service.delete('notif-1', mockUserId);

      expect(mockPrismaService.core_notifications.delete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
    });

    it('يجب رمي استثناء عند محاولة حذف إشعار غير موجود', async () => {
      mockPrismaService.core_notifications.findFirst.mockResolvedValue(null);

      await expect(service.delete('invalid-id', mockUserId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOldNotifications', () => {
    it('يجب حذف الإشعارات القديمة المقروءة', async () => {
      mockPrismaService.core_notifications.deleteMany.mockResolvedValue({ count: 15 });

      const result = await service.deleteOldNotifications(mockUserId, 30);

      expect(result.count).toBe(15);
      expect(mockPrismaService.core_notifications.deleteMany).toHaveBeenCalled();
    });
  });

  describe('notifyUser', () => {
    it('يجب إنشاء إشعار للمستخدم', async () => {
      mockPrismaService.core_notifications.create.mockResolvedValue(mockNotification);

      await service.notifyUser(mockUserId, 'success', 'عملية ناجحة', 'تمت العملية بنجاح');

      expect(mockPrismaService.core_notifications.create).toHaveBeenCalled();
    });
  });

  describe('notifyMultipleUsers', () => {
    it('يجب إنشاء إشعارات لعدة مستخدمين', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      mockPrismaService.core_notifications.create.mockResolvedValue(mockNotification);

      await service.notifyMultipleUsers(userIds, 'info', 'إشعار عام', 'رسالة للجميع');

      expect(mockPrismaService.core_notifications.create).toHaveBeenCalledTimes(3);
    });
  });
});
