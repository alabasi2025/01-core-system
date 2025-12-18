import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  const mockPrismaService = {
    core_reconciliations: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    core_reconciliation_matches: { findMany: jest.fn(), create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReconciliationService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<ReconciliationService>(ReconciliationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
