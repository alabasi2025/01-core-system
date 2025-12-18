import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AccountsService', () => {
  let service: AccountsService;
  const mockPrismaService = {
    core_accounts: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    core_journal_entry_lines: { aggregate: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<AccountsService>(AccountsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findAll', () => {
    it('should return accounts', async () => {
      mockPrismaService.core_accounts.findMany.mockResolvedValue([{ id: '1', name: 'Cash' }]);
      const result = await service.findAll('b1', {});
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return an account', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue({ id: '1', name: 'Cash' });
      const result = await service.findOne('b1', '1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue(null);
      await expect(service.findOne('b1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
