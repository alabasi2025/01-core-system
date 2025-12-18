import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    core_accounts: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    core_journal_entry_lines: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all accounts for a business', async () => {
      const mockAccounts = [
        { id: '1', code: '1', name: 'الأصول', type: 'asset', nature: 'debit' },
        { id: '2', code: '2', name: 'الخصوم', type: 'liability', nature: 'credit' },
      ];

      mockPrismaService.core_accounts.findMany.mockResolvedValue(mockAccounts);

      const result = await service.findAll('business-1', {});

      expect(result).toHaveLength(2);
    });

    it('should filter accounts by type', async () => {
      const mockAccounts = [
        { id: '1', code: '1', name: 'الأصول', type: 'asset', nature: 'debit' },
      ];

      mockPrismaService.core_accounts.findMany.mockResolvedValue(mockAccounts);

      const result = await service.findAll('business-1', { type: 'asset' as any });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('asset');
    });

    it('should filter accounts by search term', async () => {
      const mockAccounts = [
        { id: '1', code: '11', name: 'النقدية', type: 'asset', nature: 'debit' },
      ];

      mockPrismaService.core_accounts.findMany.mockResolvedValue(mockAccounts);

      const result = await service.findAll('business-1', { search: 'نقد' });

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return an account by id', async () => {
      const mockAccount = {
        id: '1',
        code: '1',
        name: 'الأصول',
        type: 'asset',
        nature: 'debit',
        businessId: 'business-1',
        children: [],
      };

      mockPrismaService.core_accounts.findFirst.mockResolvedValue(mockAccount);

      const result = await service.findOne('business-1', '1');

      expect(result).toBeDefined();
      expect(result.code).toBe('1');
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('business-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new account', async () => {
      const createAccountDto = {
        code: '11',
        name: 'الأصول المتداولة',
        type: 'asset' as any,
        nature: 'debit' as any,
      };

      mockPrismaService.core_accounts.findFirst.mockResolvedValue(null);
      mockPrismaService.core_accounts.create.mockResolvedValue({
        id: '1',
        ...createAccountDto,
        level: 1,
      });

      const result = await service.create('business-1', createAccountDto);

      expect(result).toBeDefined();
      expect(result.code).toBe('11');
    });

    it('should throw ConflictException if account code already exists', async () => {
      const createAccountDto = {
        code: '1',
        name: 'حساب موجود',
        type: 'asset' as any,
        nature: 'debit' as any,
      };

      mockPrismaService.core_accounts.findFirst.mockResolvedValue({
        id: '1',
        code: '1',
      });

      await expect(
        service.create('business-1', createAccountDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should create account with parent', async () => {
      const createAccountDto = {
        code: '11',
        name: 'الأصول المتداولة',
        type: 'asset' as any,
        nature: 'debit' as any,
        parentId: 'parent-1',
      };

      mockPrismaService.core_accounts.findFirst
        .mockResolvedValueOnce(null) // Code check
        .mockResolvedValueOnce({ // Parent check
          id: 'parent-1',
          code: '1',
          type: 'asset',
          level: 1,
          isParent: false,
        });
      mockPrismaService.core_accounts.update.mockResolvedValue({});
      mockPrismaService.core_accounts.create.mockResolvedValue({
        id: '1',
        ...createAccountDto,
        level: 2,
      });

      const result = await service.create('business-1', createAccountDto);

      expect(result.level).toBe(2);
    });

    it('should throw NotFoundException if parent not found', async () => {
      const createAccountDto = {
        code: '11',
        name: 'الأصول المتداولة',
        type: 'asset' as any,
        nature: 'debit' as any,
        parentId: 'non-existent',
      };

      mockPrismaService.core_accounts.findFirst
        .mockResolvedValueOnce(null) // Code check
        .mockResolvedValueOnce(null); // Parent check

      await expect(
        service.create('business-1', createAccountDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if parent type does not match', async () => {
      const createAccountDto = {
        code: '11',
        name: 'حساب خاطئ',
        type: 'asset' as any,
        nature: 'debit' as any,
        parentId: 'parent-1',
      };

      mockPrismaService.core_accounts.findFirst
        .mockResolvedValueOnce(null) // Code check
        .mockResolvedValueOnce({ // Parent check
          id: 'parent-1',
          code: '2',
          type: 'liability', // Different type
          level: 1,
        });

      await expect(
        service.create('business-1', createAccountDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update an existing account', async () => {
      const updateAccountDto = {
        name: 'اسم محدث',
      };

      mockPrismaService.core_accounts.findFirst.mockResolvedValue({
        id: '1',
        code: '1',
        name: 'الاسم القديم',
        businessId: 'business-1',
      });
      mockPrismaService.core_accounts.update.mockResolvedValue({
        id: '1',
        code: '1',
        name: 'اسم محدث',
      });

      const result = await service.update('business-1', '1', updateAccountDto);

      expect(result.name).toBe('اسم محدث');
    });

    it('should throw ConflictException when code already exists', async () => {
      mockPrismaService.core_accounts.findFirst
        .mockResolvedValueOnce({
          id: '1',
          code: '1',
          businessId: 'business-1',
        })
        .mockResolvedValueOnce({
          id: '2',
          code: '2',
        });

      await expect(
        service.update('business-1', '1', { code: '2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when changing type with children', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue({
        id: '1',
        code: '1',
        type: 'asset',
        businessId: 'business-1',
      });
      mockPrismaService.core_accounts.count.mockResolvedValue(2); // Has children

      await expect(
        service.update('business-1', '1', { type: 'liability' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when changing type with transactions', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue({
        id: '1',
        code: '1',
        type: 'asset',
        businessId: 'business-1',
      });
      mockPrismaService.core_accounts.count.mockResolvedValue(0); // No children
      mockPrismaService.core_journal_entry_lines.count.mockResolvedValue(5); // Has transactions

      await expect(
        service.update('business-1', '1', { type: 'liability' as any }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete an account', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue({
        id: '1',
        code: '11',
        parentId: null,
        businessId: 'business-1',
      });
      mockPrismaService.core_accounts.count.mockResolvedValue(0); // No children
      mockPrismaService.core_journal_entry_lines.count.mockResolvedValue(0); // No transactions
      mockPrismaService.core_accounts.delete.mockResolvedValue({
        id: '1',
        code: '11',
      });

      const result = await service.remove('business-1', '1');

      expect(result.message).toBe('تم حذف الحساب بنجاح');
    });

    it('should throw ConflictException if account has children', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue({
        id: '1',
        code: '1',
        businessId: 'business-1',
      });
      mockPrismaService.core_accounts.count.mockResolvedValue(3); // Has children

      await expect(
        service.remove('business-1', '1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if account has transactions', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue({
        id: '1',
        code: '11',
        businessId: 'business-1',
      });
      mockPrismaService.core_accounts.count.mockResolvedValue(0); // No children
      mockPrismaService.core_journal_entry_lines.count.mockResolvedValue(5); // Has transactions

      await expect(
        service.remove('business-1', '1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should update parent isParent flag when last child deleted', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue({
        id: '1',
        code: '11',
        parentId: 'parent-1',
        businessId: 'business-1',
      });
      mockPrismaService.core_accounts.count
        .mockResolvedValueOnce(0) // No children
        .mockResolvedValueOnce(0); // No siblings after delete
      mockPrismaService.core_journal_entry_lines.count.mockResolvedValue(0);
      mockPrismaService.core_accounts.delete.mockResolvedValue({});
      mockPrismaService.core_accounts.update.mockResolvedValue({});

      await service.remove('business-1', '1');

      expect(mockPrismaService.core_accounts.update).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        data: { isParent: false },
      });
    });
  });

  describe('getTree', () => {
    it('should return accounts as tree structure', async () => {
      const mockAccounts = [
        { id: '1', code: '1', name: 'الأصول', type: 'asset', parentId: null, level: 1 },
        { id: '2', code: '11', name: 'الأصول المتداولة', type: 'asset', parentId: '1', level: 2 },
        { id: '3', code: '2', name: 'الخصوم', type: 'liability', parentId: null, level: 1 },
      ];

      mockPrismaService.core_accounts.findMany.mockResolvedValue(mockAccounts);

      const result = await service.getTree('business-1');

      expect(result.assets).toHaveLength(1);
      expect(result.liabilities).toHaveLength(1);
    });
  });

  describe('seedDefaultAccounts', () => {
    it('should create default accounts', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue(null);
      mockPrismaService.core_accounts.create.mockResolvedValue({
        id: 'new-id',
        code: '1',
      });

      const result = await service.seedDefaultAccounts('business-1');

      expect(result.created).toBeGreaterThan(0);
    });

    it('should update existing accounts', async () => {
      mockPrismaService.core_accounts.findFirst.mockResolvedValue({
        id: 'existing-id',
        code: '1',
      });
      mockPrismaService.core_accounts.update.mockResolvedValue({
        id: 'existing-id',
        code: '1',
      });

      const result = await service.seedDefaultAccounts('business-1');

      expect(result.updated).toBeGreaterThan(0);
    });
  });
});
