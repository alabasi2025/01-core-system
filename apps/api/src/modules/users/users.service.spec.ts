import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  const mockPrismaService = {
    core_users: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    core_roles: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findAll', () => {
    it('should return users', async () => {
      mockPrismaService.core_users.findMany.mockResolvedValue([{ id: '1', name: 'Test User' }]);
      mockPrismaService.core_users.count.mockResolvedValue(1);
      const result = await service.findAll('b1', { page: 1, limit: 10 });
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue({ id: '1', name: 'Test User' });
      const result = await service.findOne('b1', '1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue(null);
      await expect(service.findOne('b1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
