import { Test, TestingModule } from '@nestjs/testing';
import { JournalEntriesService } from './journal-entries.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('JournalEntriesService', () => {
  let service: JournalEntriesService;
  const mockPrismaService = {
    core_journal_entries: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    core_journal_entry_lines: { createMany: jest.fn() },
    core_accounting_periods: { findFirst: jest.fn() },
    core_accounts: { findMany: jest.fn() },
    core_stations: { findFirst: jest.fn() },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };
  const mockAuditService = { logCreate: jest.fn(), logUpdate: jest.fn(), logPost: jest.fn(), logVoid: jest.fn(), logSoftDelete: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntriesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();
    service = module.get<JournalEntriesService>(JournalEntriesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findAll', () => {
    it('should return journal entries', async () => {
      mockPrismaService.core_journal_entries.findMany.mockResolvedValue([]);
      mockPrismaService.core_journal_entries.count.mockResolvedValue(0);
      const result = await service.findAll('b1', {});
      expect(result).toBeDefined();
      expect(result.data).toEqual([]);
    });
  });
});
