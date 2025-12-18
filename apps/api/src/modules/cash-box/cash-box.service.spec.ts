import { Test, TestingModule } from '@nestjs/testing';
import { CashBoxService } from './cash-box.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CashBoxService', () => {
  let service: CashBoxService;
  const mockPrismaService = {
    core_cash_boxes: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    core_cash_box_sessions: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    core_cash_box_transactions: { findMany: jest.fn(), create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashBoxService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<CashBoxService>(CashBoxService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
