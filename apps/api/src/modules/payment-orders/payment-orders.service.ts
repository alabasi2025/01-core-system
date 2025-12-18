import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CreatePaymentOrderDto,
  UpdatePaymentOrderDto,
  ExecutePaymentDto,
  CancelPaymentOrderDto,
  PaymentOrderQueryDto,
  PaymentOrderResponseDto,
  PaginatedPaymentOrdersDto,
  PaymentOrderStatisticsDto,
  PaymentOrderStatus,
} from './dto';

@Injectable()
export class PaymentOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, userId: string, dto: CreatePaymentOrderDto): Promise<PaymentOrderResponseDto> {
    // Generate order number
    const orderNumber = await this.generateOrderNumber(businessId);

    // Calculate totals
    const items = dto.items.map((item) => {
      const quantity = item.quantity || 1;
      const amount = quantity * item.unitPrice;
      const taxAmount = item.taxAmount || 0;
      const totalAmount = amount + taxAmount;
      return {
        ...item,
        quantity,
        amount,
        taxAmount,
        totalAmount,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

    const paymentOrder = await this.prisma.core_payment_orders.create({
      data: {
        businessId,
        orderNumber,
        orderDate: new Date(dto.orderDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        payeeType: dto.payeeType as any,
        payeeId: dto.payeeId,
        payeeName: dto.payeeName,
        payeeAccount: dto.payeeAccount,
        payeeBankName: dto.payeeBankName,
        paymentMethod: (dto.paymentMethod || 'cash') as any,
        currency: dto.currency || 'YER',
        totalAmount: new Decimal(totalAmount),
        paidAmount: new Decimal(0),
        status: 'draft',
        priority: (dto.priority || 'normal') as any,
        description: dto.description,
        notes: dto.notes,
        stationId: dto.stationId,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        createdById: userId,
        items: {
          create: items.map((item, index) => ({
            accountId: item.accountId,
            description: item.description,
            quantity: new Decimal(item.quantity),
            unitPrice: new Decimal(item.unitPrice),
            amount: new Decimal(item.amount),
            taxAmount: new Decimal(item.taxAmount),
            totalAmount: new Decimal(item.totalAmount),
            costCenterId: item.costCenterId,
            projectId: item.projectId,
            notes: item.notes,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return this.formatPaymentOrderResponse(paymentOrder);
  }

  async findAll(businessId: string, query: PaymentOrderQueryDto): Promise<PaginatedPaymentOrdersDto> {
    const { search, status, payeeType, priority, stationId, fromDate, toDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { payeeName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (payeeType) {
      where.payeeType = payeeType;
    }

    if (priority) {
      where.priority = priority;
    }

    if (stationId) {
      where.stationId = stationId;
    }

    if (fromDate) {
      where.orderDate = { ...where.orderDate, gte: new Date(fromDate) };
    }

    if (toDate) {
      where.orderDate = { ...where.orderDate, lte: new Date(toDate) };
    }

    const [orders, total] = await Promise.all([
      this.prisma.core_payment_orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.core_payment_orders.count({ where }),
    ]);

    return {
      data: orders.map((order) => this.formatPaymentOrderResponse(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(businessId: string, id: string): Promise<PaymentOrderResponseDto> {
    const order = await this.prisma.core_payment_orders.findFirst({
      where: { id, businessId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('أمر الدفع غير موجود');
    }

    return this.formatPaymentOrderResponse(order);
  }

  async update(businessId: string, id: string, dto: UpdatePaymentOrderDto): Promise<PaymentOrderResponseDto> {
    const order = await this.prisma.core_payment_orders.findFirst({
      where: { id, businessId },
    });

    if (!order) {
      throw new NotFoundException('أمر الدفع غير موجود');
    }

    if (order.status !== 'draft') {
      throw new BadRequestException('لا يمكن تعديل أمر دفع غير مسودة');
    }

    // Calculate new totals if items are provided
    let totalAmount = order.totalAmount;
    let itemsData: any = undefined;

    if (dto.items) {
      const items = dto.items.map((item) => {
        const quantity = item.quantity || 1;
        const amount = quantity * item.unitPrice;
        const taxAmount = item.taxAmount || 0;
        const itemTotalAmount = amount + taxAmount;
        return {
          ...item,
          quantity,
          amount,
          taxAmount,
          totalAmount: itemTotalAmount,
        };
      });

      totalAmount = new Decimal(items.reduce((sum, item) => sum + item.totalAmount, 0));

      // Delete existing items and create new ones
      await this.prisma.core_payment_order_items.deleteMany({
        where: { paymentOrderId: id },
      });

      itemsData = {
        create: items.map((item, index) => ({
          accountId: item.accountId,
          description: item.description,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          amount: new Decimal(item.amount),
          taxAmount: new Decimal(item.taxAmount),
          totalAmount: new Decimal(item.totalAmount),
          costCenterId: item.costCenterId,
          projectId: item.projectId,
          notes: item.notes,
          sortOrder: index,
        })),
      };
    }

    const updatedOrder = await this.prisma.core_payment_orders.update({
      where: { id },
      data: {
        orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        payeeType: dto.payeeType as any,
        payeeId: dto.payeeId,
        payeeName: dto.payeeName,
        payeeAccount: dto.payeeAccount,
        payeeBankName: dto.payeeBankName,
        paymentMethod: dto.paymentMethod as any,
        priority: dto.priority as any,
        description: dto.description,
        notes: dto.notes,
        stationId: dto.stationId,
        totalAmount,
        items: itemsData,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return this.formatPaymentOrderResponse(updatedOrder);
  }

  async submitForApproval(businessId: string, id: string): Promise<PaymentOrderResponseDto> {
    const order = await this.prisma.core_payment_orders.findFirst({
      where: { id, businessId },
    });

    if (!order) {
      throw new NotFoundException('أمر الدفع غير موجود');
    }

    if (order.status !== 'draft') {
      throw new BadRequestException('لا يمكن تقديم أمر دفع غير مسودة للاعتماد');
    }

    const updatedOrder = await this.prisma.core_payment_orders.update({
      where: { id },
      data: {
        status: 'pending_approval',
      },
      include: {
        items: true,
      },
    });

    return this.formatPaymentOrderResponse(updatedOrder);
  }

  async approve(businessId: string, id: string, userId: string): Promise<PaymentOrderResponseDto> {
    const order = await this.prisma.core_payment_orders.findFirst({
      where: { id, businessId },
    });

    if (!order) {
      throw new NotFoundException('أمر الدفع غير موجود');
    }

    if (order.status !== 'pending_approval') {
      throw new BadRequestException('أمر الدفع ليس في حالة انتظار الاعتماد');
    }

    const updatedOrder = await this.prisma.core_payment_orders.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    return this.formatPaymentOrderResponse(updatedOrder);
  }

  async execute(businessId: string, id: string, userId: string, dto: ExecutePaymentDto): Promise<PaymentOrderResponseDto> {
    const order = await this.prisma.core_payment_orders.findFirst({
      where: { id, businessId },
    });

    if (!order) {
      throw new NotFoundException('أمر الدفع غير موجود');
    }

    if (!['approved', 'partially_paid'].includes(order.status)) {
      throw new BadRequestException('أمر الدفع ليس في حالة تسمح بالتنفيذ');
    }

    const remainingAmount = Number(order.totalAmount) - Number(order.paidAmount);
    if (dto.amount > remainingAmount) {
      throw new BadRequestException(`المبلغ المدفوع أكبر من المبلغ المتبقي (${remainingAmount})`);
    }

    const newPaidAmount = Number(order.paidAmount) + dto.amount;
    const newStatus = newPaidAmount >= Number(order.totalAmount) ? 'paid' : 'partially_paid';

    // Create execution record
    await this.prisma.core_payment_executions.create({
      data: {
        paymentOrderId: id,
        executionDate: new Date(dto.executionDate),
        amount: new Decimal(dto.amount),
        paymentMethod: dto.paymentMethod as any,
        referenceNumber: dto.referenceNumber,
        bankAccountId: dto.bankAccountId,
        cashBoxId: dto.cashBoxId,
        notes: dto.notes,
        executedById: userId,
      },
    });

    const updatedOrder = await this.prisma.core_payment_orders.update({
      where: { id },
      data: {
        paidAmount: new Decimal(newPaidAmount),
        status: newStatus,
        executedById: newStatus === 'paid' ? userId : order.executedById,
        executedAt: newStatus === 'paid' ? new Date() : order.executedAt,
      },
      include: {
        items: true,
      },
    });

    return this.formatPaymentOrderResponse(updatedOrder);
  }

  async cancel(businessId: string, id: string, userId: string, dto: CancelPaymentOrderDto): Promise<PaymentOrderResponseDto> {
    const order = await this.prisma.core_payment_orders.findFirst({
      where: { id, businessId },
    });

    if (!order) {
      throw new NotFoundException('أمر الدفع غير موجود');
    }

    if (['paid', 'cancelled'].includes(order.status)) {
      throw new BadRequestException('لا يمكن إلغاء أمر دفع مدفوع أو ملغي');
    }

    if (Number(order.paidAmount) > 0) {
      throw new BadRequestException('لا يمكن إلغاء أمر دفع تم دفع جزء منه');
    }

    const updatedOrder = await this.prisma.core_payment_orders.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledById: userId,
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
      },
      include: {
        items: true,
      },
    });

    return this.formatPaymentOrderResponse(updatedOrder);
  }

  async remove(businessId: string, id: string): Promise<{ message: string }> {
    const order = await this.prisma.core_payment_orders.findFirst({
      where: { id, businessId },
    });

    if (!order) {
      throw new NotFoundException('أمر الدفع غير موجود');
    }

    if (order.status !== 'draft') {
      throw new BadRequestException('لا يمكن حذف أمر دفع غير مسودة');
    }

    await this.prisma.core_payment_orders.delete({
      where: { id },
    });

    return { message: 'تم حذف أمر الدفع بنجاح' };
  }

  async getStatistics(businessId: string): Promise<PaymentOrderStatisticsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      draftOrders,
      pendingApprovalOrders,
      approvedOrders,
      paidOrders,
      cancelledOrders,
      amountStats,
      overdueStats,
    ] = await Promise.all([
      this.prisma.core_payment_orders.count({ where: { businessId } }),
      this.prisma.core_payment_orders.count({ where: { businessId, status: 'draft' } }),
      this.prisma.core_payment_orders.count({ where: { businessId, status: 'pending_approval' } }),
      this.prisma.core_payment_orders.count({ where: { businessId, status: 'approved' } }),
      this.prisma.core_payment_orders.count({ where: { businessId, status: 'paid' } }),
      this.prisma.core_payment_orders.count({ where: { businessId, status: 'cancelled' } }),
      this.prisma.core_payment_orders.aggregate({
        where: { businessId, status: { notIn: ['cancelled'] } },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.core_payment_orders.aggregate({
        where: {
          businessId,
          status: { in: ['approved', 'partially_paid'] },
          dueDate: { lt: today },
        },
        _count: true,
        _sum: { totalAmount: true, paidAmount: true },
      }),
    ]);

    const totalAmount = Number(amountStats._sum.totalAmount || 0);
    const paidAmount = Number(amountStats._sum.paidAmount || 0);
    const overdueAmount = Number(overdueStats._sum.totalAmount || 0) - Number(overdueStats._sum.paidAmount || 0);

    return {
      totalOrders,
      draftOrders,
      pendingApprovalOrders,
      approvedOrders,
      paidOrders,
      cancelledOrders,
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
      overdueOrders: overdueStats._count,
      overdueAmount,
    };
  }

  private async generateOrderNumber(businessId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const lastOrder = await this.prisma.core_payment_orders.findFirst({
      where: {
        businessId,
        orderNumber: { startsWith: prefix },
      },
      orderBy: { orderNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private formatPaymentOrderResponse(order: any): PaymentOrderResponseDto {
    return {
      id: order.id,
      businessId: order.businessId,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      dueDate: order.dueDate,
      payeeType: order.payeeType,
      payeeId: order.payeeId,
      payeeName: order.payeeName,
      payeeAccount: order.payeeAccount,
      payeeBankName: order.payeeBankName,
      paymentMethod: order.paymentMethod,
      currency: order.currency,
      totalAmount: Number(order.totalAmount),
      paidAmount: Number(order.paidAmount),
      remainingAmount: Number(order.totalAmount) - Number(order.paidAmount),
      status: order.status,
      priority: order.priority,
      description: order.description,
      notes: order.notes,
      stationId: order.stationId,
      sourceType: order.sourceType,
      sourceId: order.sourceId,
      journalEntryId: order.journalEntryId,
      createdById: order.createdById,
      approvedById: order.approvedById,
      approvedAt: order.approvedAt,
      executedById: order.executedById,
      executedAt: order.executedAt,
      cancelledById: order.cancelledById,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items?.map((item: any) => ({
        id: item.id,
        accountId: item.accountId,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
        taxAmount: Number(item.taxAmount),
        totalAmount: Number(item.totalAmount),
        costCenterId: item.costCenterId,
        projectId: item.projectId,
        notes: item.notes,
      })),
    };
  }
}
