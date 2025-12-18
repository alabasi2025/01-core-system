import { Test, TestingModule } from '@nestjs/testing';
import { PaymentOrdersService } from './payment-orders.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PaymentOrdersService', () => {
  let service: PaymentOrdersService;
  const mockPrismaService = {
    core_payment_orders: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    core_payment_order_items: { createMany: jest.fn() },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentOrdersService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<PaymentOrdersService>(PaymentOrdersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
