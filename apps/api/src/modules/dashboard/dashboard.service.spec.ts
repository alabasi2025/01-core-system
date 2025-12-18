import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const mockPrismaService = {
    core_accounts: { findMany: jest.fn() },
    core_journal_entry_lines: { groupBy: jest.fn() },
    core_payment_orders: { count: jest.fn(), aggregate: jest.fn() },
    core_reconciliations: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
