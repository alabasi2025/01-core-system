import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ServicesService', () => {
  let service: ServicesService;
  const mockPrismaService = {
    core_services: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    core_service_categories: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<ServicesService>(ServicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findAllServices', () => {
    it('should return services', async () => {
      mockPrismaService.core_services.findMany.mockResolvedValue([{ id: '1', name: 'Service 1' }]);
      const result = await service.findAllServices('b1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findServiceById', () => {
    it('should return a service', async () => {
      mockPrismaService.core_services.findFirst.mockResolvedValue({ id: '1', name: 'Service 1' });
      const result = await service.findServiceById('b1', '1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.core_services.findFirst.mockResolvedValue(null);
      await expect(service.findServiceById('b1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
