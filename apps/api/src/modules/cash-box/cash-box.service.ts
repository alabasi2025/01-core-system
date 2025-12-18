import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCashBoxDto,
  UpdateCashBoxDto,
  CreateCollectorDto,
  UpdateCollectorDto,
  OpenCashBoxSessionDto,
  CloseCashBoxSessionDto,
  OpenCollectorSessionDto,
  CloseCollectorSessionDto,
  CreateCashBoxTransactionDto,
  CreateCollectionDto,
  DepositCollectionsDto,
} from './dto';

@Injectable()
export class CashBoxService {
  constructor(private prisma: PrismaService) {}

  // ==================== Cash Boxes ====================

  async findAllCashBoxes(businessId: string) {
    return this.prisma.core_cash_boxes.findMany({
      where: { businessId },
      include: {
        collectors: { select: { id: true, name: true, code: true } },
        _count: { select: { transactions: true, sessions: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findCashBoxById(id: string, businessId: string) {
    const cashBox = await this.prisma.core_cash_boxes.findFirst({
      where: { id, businessId },
      include: {
        collectors: true,
        sessions: {
          where: { status: 'open' },
          take: 1,
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!cashBox) {
      throw new NotFoundException('صندوق التحصيل غير موجود');
    }

    return cashBox;
  }

  async createCashBox(businessId: string, dto: CreateCashBoxDto) {
    return this.prisma.core_cash_boxes.create({
      data: {
        businessId,
        ...dto,
        currentBalance: dto.openingBalance || 0,
      },
    });
  }

  async updateCashBox(id: string, businessId: string, dto: UpdateCashBoxDto) {
    const cashBox = await this.prisma.core_cash_boxes.findFirst({
      where: { id, businessId },
    });

    if (!cashBox) {
      throw new NotFoundException('صندوق التحصيل غير موجود');
    }

    return this.prisma.core_cash_boxes.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCashBox(id: string, businessId: string) {
    const cashBox = await this.prisma.core_cash_boxes.findFirst({
      where: { id, businessId },
      include: { _count: { select: { transactions: true } } },
    });

    if (!cashBox) {
      throw new NotFoundException('صندوق التحصيل غير موجود');
    }

    if (cashBox._count.transactions > 0) {
      throw new BadRequestException('لا يمكن حذف صندوق له حركات');
    }

    return this.prisma.core_cash_boxes.delete({ where: { id } });
  }

  // ==================== Collectors ====================

  async findAllCollectors(businessId: string) {
    return this.prisma.core_collectors.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        cashBox: { select: { id: true, name: true, code: true } },
        _count: { select: { collections: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findCollectorById(id: string, businessId: string) {
    const collector = await this.prisma.core_collectors.findFirst({
      where: { id, businessId },
      include: {
        user: true,
        cashBox: true,
        sessions: {
          where: { status: 'active' },
          take: 1,
        },
        collections: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!collector) {
      throw new NotFoundException('المتحصل غير موجود');
    }

    return collector;
  }

  async createCollector(businessId: string, dto: CreateCollectorDto) {
    // Check if user exists
    const user = await this.prisma.core_users.findFirst({
      where: { id: dto.userId, businessId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return this.prisma.core_collectors.create({
      data: {
        businessId,
        ...dto,
      },
    });
  }

  async updateCollector(id: string, businessId: string, dto: UpdateCollectorDto) {
    const collector = await this.prisma.core_collectors.findFirst({
      where: { id, businessId },
    });

    if (!collector) {
      throw new NotFoundException('المتحصل غير موجود');
    }

    return this.prisma.core_collectors.update({
      where: { id },
      data: dto,
    });
  }

  // ==================== Cash Box Sessions ====================

  async openCashBoxSession(businessId: string, userId: string, dto: OpenCashBoxSessionDto) {
    const cashBox = await this.prisma.core_cash_boxes.findFirst({
      where: { id: dto.cashBoxId, businessId },
    });

    if (!cashBox) {
      throw new NotFoundException('صندوق التحصيل غير موجود');
    }

    // Check for existing open session
    const existingSession = await this.prisma.core_cash_box_sessions.findFirst({
      where: { cashBoxId: dto.cashBoxId, status: 'open' },
    });

    if (existingSession) {
      throw new BadRequestException('يوجد جلسة مفتوحة بالفعل لهذا الصندوق');
    }

    return this.prisma.core_cash_box_sessions.create({
      data: {
        cashBoxId: dto.cashBoxId,
        openedBy: userId,
        openingBalance: dto.openingBalance,
        notes: dto.notes,
      },
    });
  }

  async closeCashBoxSession(sessionId: string, userId: string, dto: CloseCashBoxSessionDto) {
    const session = await this.prisma.core_cash_box_sessions.findFirst({
      where: { id: sessionId, status: 'open' },
    });

    if (!session) {
      throw new NotFoundException('الجلسة غير موجودة أو مغلقة');
    }

    const expectedBalance = Number(session.openingBalance) + Number(session.totalIn) - Number(session.totalOut);
    const difference = dto.closingBalance - expectedBalance;

    return this.prisma.core_cash_box_sessions.update({
      where: { id: sessionId },
      data: {
        closedBy: userId,
        closingBalance: dto.closingBalance,
        expectedBalance,
        difference,
        status: 'closed',
        closedAt: new Date(),
        notes: dto.notes,
      },
    });
  }

  // ==================== Collector Sessions ====================

  async openCollectorSession(businessId: string, dto: OpenCollectorSessionDto) {
    const collector = await this.prisma.core_collectors.findFirst({
      where: { id: dto.collectorId, businessId },
    });

    if (!collector) {
      throw new NotFoundException('المتحصل غير موجود');
    }

    // Check for existing active session
    const existingSession = await this.prisma.core_collector_sessions.findFirst({
      where: { collectorId: dto.collectorId, status: 'active' },
    });

    if (existingSession) {
      throw new BadRequestException('يوجد جلسة نشطة بالفعل لهذا المتحصل');
    }

    return this.prisma.core_collector_sessions.create({
      data: {
        collectorId: dto.collectorId,
        openingBalance: dto.openingBalance,
        notes: dto.notes,
      },
    });
  }

  async closeCollectorSession(sessionId: string, dto: CloseCollectorSessionDto) {
    const session = await this.prisma.core_collector_sessions.findFirst({
      where: { id: sessionId, status: 'active' },
    });

    if (!session) {
      throw new NotFoundException('الجلسة غير موجودة أو منتهية');
    }

    return this.prisma.core_collector_sessions.update({
      where: { id: sessionId },
      data: {
        closingBalance: dto.closingBalance,
        status: 'ended',
        endedAt: new Date(),
        notes: dto.notes,
      },
    });
  }

  // ==================== Transactions ====================

  async createTransaction(businessId: string, userId: string, dto: CreateCashBoxTransactionDto) {
    const cashBox = await this.prisma.core_cash_boxes.findFirst({
      where: { id: dto.cashBoxId, businessId },
    });

    if (!cashBox) {
      throw new NotFoundException('صندوق التحصيل غير موجود');
    }

    // Get current open session
    const session = await this.prisma.core_cash_box_sessions.findFirst({
      where: { cashBoxId: dto.cashBoxId, status: 'open' },
    });

    // Determine if it's incoming or outgoing
    const isIncoming = ['collection', 'transfer_in', 'adjustment'].includes(dto.type);
    const balanceChange = isIncoming ? dto.amount : -dto.amount;

    // Update cash box balance
    await this.prisma.core_cash_boxes.update({
      where: { id: dto.cashBoxId },
      data: {
        currentBalance: { increment: balanceChange },
      },
    });

    // Update session totals if exists
    if (session) {
      await this.prisma.core_cash_box_sessions.update({
        where: { id: session.id },
        data: isIncoming
          ? { totalIn: { increment: dto.amount } }
          : { totalOut: { increment: dto.amount } },
      });
    }

    return this.prisma.core_cash_box_transactions.create({
      data: {
        cashBoxId: dto.cashBoxId,
        sessionId: session?.id,
        type: dto.type,
        amount: dto.amount,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        referenceNumber: dto.referenceNumber,
        description: dto.description,
        collectorId: dto.collectorId,
        createdBy: userId,
      },
    });
  }

  async findTransactions(cashBoxId: string, businessId: string, page = 1, limit = 20) {
    const cashBox = await this.prisma.core_cash_boxes.findFirst({
      where: { id: cashBoxId, businessId },
    });

    if (!cashBox) {
      throw new NotFoundException('صندوق التحصيل غير موجود');
    }

    const [data, total] = await Promise.all([
      this.prisma.core_cash_box_transactions.findMany({
        where: { cashBoxId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.core_cash_box_transactions.count({ where: { cashBoxId } }),
    ]);

    return { data, total, page, limit };
  }

  // ==================== Collections ====================

  async createCollection(businessId: string, userId: string, dto: CreateCollectionDto) {
    const collector = await this.prisma.core_collectors.findFirst({
      where: { id: dto.collectorId, businessId },
    });

    if (!collector) {
      throw new NotFoundException('المتحصل غير موجود');
    }

    // Get active session
    const session = await this.prisma.core_collector_sessions.findFirst({
      where: { collectorId: dto.collectorId, status: 'active' },
    });

    // Update collector balance
    await this.prisma.core_collectors.update({
      where: { id: dto.collectorId },
      data: {
        currentBalance: { increment: dto.amount },
      },
    });

    // Update session totals if exists
    if (session) {
      await this.prisma.core_collector_sessions.update({
        where: { id: session.id },
        data: { totalCollected: { increment: dto.amount } },
      });
    }

    return this.prisma.core_collections.create({
      data: {
        businessId,
        collectorId: dto.collectorId,
        sessionId: session?.id,
        receiptNumber: dto.receiptNumber,
        collectionDate: new Date(dto.collectionDate),
        amount: dto.amount,
        paymentMethod: dto.paymentMethod || 'cash',
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        customerId: dto.customerId,
        customerName: dto.customerName,
        notes: dto.notes,
        createdBy: userId,
      },
    });
  }

  async findCollections(businessId: string, filters: any = {}, page = 1, limit = 20) {
    const where: any = { businessId };

    if (filters.collectorId) where.collectorId = filters.collectorId;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom) where.collectionDate = { gte: new Date(filters.dateFrom) };
    if (filters.dateTo) where.collectionDate = { ...where.collectionDate, lte: new Date(filters.dateTo) };

    const [data, total] = await Promise.all([
      this.prisma.core_collections.findMany({
        where,
        include: {
          collector: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.core_collections.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async depositCollections(businessId: string, userId: string, dto: DepositCollectionsDto) {
    const collections = await this.prisma.core_collections.findMany({
      where: {
        id: { in: dto.collectionIds },
        businessId,
        status: 'confirmed',
      },
    });

    if (collections.length !== dto.collectionIds.length) {
      throw new BadRequestException('بعض التحصيلات غير موجودة أو غير مؤكدة');
    }

    // Update collections status
    await this.prisma.core_collections.updateMany({
      where: { id: { in: dto.collectionIds } },
      data: {
        status: 'deposited',
        depositedAt: new Date(),
        depositReference: dto.depositReference,
      },
    });

    return { deposited: collections.length };
  }

  // ==================== Statistics ====================

  async getStatistics(businessId: string) {
    const [cashBoxes, collectors, pendingCollections, todayCollections] = await Promise.all([
      this.prisma.core_cash_boxes.aggregate({
        where: { businessId, isActive: true },
        _sum: { currentBalance: true },
        _count: true,
      }),
      this.prisma.core_collectors.aggregate({
        where: { businessId, isActive: true },
        _sum: { currentBalance: true },
        _count: true,
      }),
      this.prisma.core_collections.aggregate({
        where: { businessId, status: 'pending' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.core_collections.aggregate({
        where: {
          businessId,
          collectionDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      cashBoxes: {
        count: cashBoxes._count,
        totalBalance: cashBoxes._sum.currentBalance || 0,
      },
      collectors: {
        count: collectors._count,
        totalBalance: collectors._sum.currentBalance || 0,
      },
      pendingCollections: {
        count: pendingCollections._count,
        totalAmount: pendingCollections._sum.amount || 0,
      },
      todayCollections: {
        count: todayCollections._count,
        totalAmount: todayCollections._sum.amount || 0,
      },
    };
  }
}
