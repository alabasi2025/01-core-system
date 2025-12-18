import { Test, TestingModule } from '@nestjs/testing';
import { AccountingPeriodsService } from './accounting-periods.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AccountingPeriodsService', () => {
  let service: AccountingPeriodsService;
  const mockPrismaService = {
    core_accounting_periods: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountingPeriodsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<AccountingPeriodsService>(AccountingPeriodsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
