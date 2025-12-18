import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  const mockPrismaService = {
    core_reconciliations: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    core_reconciliation_rules: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    core_reconciliation_matches: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    core_reconciliation_exceptions: {
      count: jest.fn(),
      create: jest.fn(),
    },
    core_reconciliation_history: {
      create: jest.fn(),
    },
    core_clearing_entries: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  const mockBusinessId = 'business-uuid-123';
  const mockUserId = 'user-uuid-456';
  const mockReconciliationId = 'recon-uuid-789';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReconciliationService>(ReconciliationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated reconciliations', async () => {
      const mockReconciliations = [
        { id: '1', name: 'Bank Reconciliation', type: 'bank', status: 'draft' },
      ];
      mockPrismaService.core_reconciliations.findMany.mockResolvedValue(mockReconciliations);
      mockPrismaService.core_reconciliations.count.mockResolvedValue(1);

      const result = await service.findAll(mockBusinessId, { page: 1, limit: 10 });
      expect(result.data).toEqual(mockReconciliations);
    });
  });

  describe('findById', () => {
    it('should return reconciliation with related data', async () => {
      const mockReconciliation = { id: mockReconciliationId, name: 'Test' };
      mockPrismaService.core_reconciliations.findFirst.mockResolvedValue(mockReconciliation);
      const result = await service.findById(mockReconciliationId, mockBusinessId);
      expect(result).toEqual(mockReconciliation);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.core_reconciliations.findFirst.mockResolvedValue(null);
      await expect(service.findById(mockReconciliationId, mockBusinessId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new reconciliation', async () => {
      const createDto = { name: 'New', type: 'bank', periodStart: '2024-01-01', periodEnd: '2024-01-31' };
      mockPrismaService.core_reconciliations.create.mockResolvedValue({ id: mockReconciliationId, ...createDto, status: 'draft' });
      mockPrismaService.core_reconciliation_history.create.mockResolvedValue({});
      const result = await service.create(mockBusinessId, mockUserId, createDto);
      expect(result.status).toBe('draft');
    });
  });

  describe('finalize', () => {
    it('should finalize reconciliation without unresolved exceptions', async () => {
      mockPrismaService.core_reconciliations.findFirst.mockResolvedValue({ id: mockReconciliationId, status: 'in_progress', businessId: mockBusinessId });
      mockPrismaService.core_reconciliation_exceptions.count.mockResolvedValue(0);
      mockPrismaService.core_reconciliations.update.mockResolvedValue({ status: 'finalized' });
      mockPrismaService.core_reconciliation_history.create.mockResolvedValue({});
      const result = await service.finalize(mockReconciliationId, mockBusinessId, mockUserId);
      expect(result.status).toBe('finalized');
    });

    it('should reject finalization with unresolved exceptions', async () => {
      mockPrismaService.core_reconciliations.findFirst.mockResolvedValue({ id: mockReconciliationId, status: 'in_progress', businessId: mockBusinessId });
      mockPrismaService.core_reconciliation_exceptions.count.mockResolvedValue(3);
      await expect(service.finalize(mockReconciliationId, mockBusinessId, mockUserId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createMatch', () => {
    it('should create a one-to-one match', async () => {
      mockPrismaService.core_reconciliations.findFirst.mockResolvedValue({ id: mockReconciliationId, status: 'in_progress', businessId: mockBusinessId });
      mockPrismaService.core_clearing_entries.findMany
        .mockResolvedValueOnce([{ id: 'e1', amount: 1000 }])
        .mockResolvedValueOnce([{ id: 'e2', amount: -1000 }]);
      mockPrismaService.core_reconciliation_matches.create.mockResolvedValue({ id: 'match-1', matchType: 'one_to_one' });
      mockPrismaService.core_clearing_entries.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.core_reconciliations.update.mockResolvedValue({});

      const result = await service.createMatch(mockBusinessId, mockUserId, {
        reconciliationId: mockReconciliationId,
        sourceEntryIds: ['e1'],
        targetEntryIds: ['e2'],
      });
      expect(result.matchType).toBe('one_to_one');
    });

    it('should reject matching in finalized reconciliation', async () => {
      mockPrismaService.core_reconciliations.findFirst.mockResolvedValue({ id: mockReconciliationId, status: 'finalized', businessId: mockBusinessId });
      await expect(service.createMatch(mockBusinessId, mockUserId, {
        reconciliationId: mockReconciliationId,
        sourceEntryIds: ['e1'],
        targetEntryIds: ['e2'],
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('rules management', () => {
    it('should create a reconciliation rule', async () => {
      const createDto = { name: 'Amount Match', matchFields: ['amount'], priority: 1 };
      mockPrismaService.core_reconciliation_rules.create.mockResolvedValue({ id: 'rule-1', ...createDto });
      const result = await service.createRule(mockBusinessId, createDto);
      expect(result.matchFields).toContain('amount');
    });

    it('should return rules ordered by priority', async () => {
      const mockRules = [{ id: '1', priority: 1 }, { id: '2', priority: 2 }];
      mockPrismaService.core_reconciliation_rules.findMany.mockResolvedValue(mockRules);
      const result = await service.findAllRules(mockBusinessId);
      expect(result[0].priority).toBe(1);
    });
  });
});
