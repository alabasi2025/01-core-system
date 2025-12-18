import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RolesService', () => {
  let service: RolesService;
  const mockPrismaService = {
    core_roles: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    core_permissions: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findAll', () => {
    it('should return roles', async () => {
      mockPrismaService.core_roles.findMany.mockResolvedValue([{ id: '1', name: 'Admin' }]);
      const result = await service.findAll('b1', { search: '' });
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a role', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue({ id: '1', name: 'Admin' });
      const result = await service.findOne('b1', '1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue(null);
      await expect(service.findOne('b1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
