import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BusinessesService', () => {
  let service: BusinessesService;
  const mockPrismaService = {
    core_businesses: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<BusinessesService>(BusinessesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findOne', () => {
    it('should return a business', async () => {
      mockPrismaService.core_businesses.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
      const result = await service.findOne('1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.core_businesses.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
