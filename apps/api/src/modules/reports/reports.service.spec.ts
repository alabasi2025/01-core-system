import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  const mockPrismaService = {
    core_accounts: { findMany: jest.fn() },
    core_journal_entry_lines: { groupBy: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
