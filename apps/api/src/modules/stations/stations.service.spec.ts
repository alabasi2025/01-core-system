import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StationsService } from './stations.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StationsService', () => {
  let service: StationsService;
  const mockPrismaService = {
    core_stations: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    core_station_users: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StationsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<StationsService>(StationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findAll', () => {
    it('should return stations', async () => {
      mockPrismaService.core_stations.findMany.mockResolvedValue([{ id: '1', name: 'Station 1' }]);
      mockPrismaService.core_stations.count.mockResolvedValue(1);
      const result = await service.findAll('b1', { page: 1, limit: 10 });
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a station', async () => {
      mockPrismaService.core_stations.findFirst.mockResolvedValue({ id: '1', name: 'Station 1' });
      const result = await service.findOne('b1', '1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.core_stations.findFirst.mockResolvedValue(null);
      await expect(service.findOne('b1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
