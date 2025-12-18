import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ImportService', () => {
  let service: ImportService;
  const mockPrismaService = {
    core_accounts: { createMany: jest.fn() },
    core_journal_entries: { createMany: jest.fn() },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<ImportService>(ImportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
