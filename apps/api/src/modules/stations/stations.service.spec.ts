import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { StationsService } from './stations.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StationsService', () => {
  let service: StationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    core_stations: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    core_station_users: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    core_users: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StationsService>(StationsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated stations', async () => {
      const mockStations = [
        { id: '1', code: 'ST-001', name: 'المحطة الرئيسية', type: 'main', _count: {} },
        { id: '2', code: 'ST-002', name: 'محطة فرعية', type: 'branch', _count: {} },
      ];

      mockPrismaService.core_stations.findMany.mockResolvedValue(mockStations);
      mockPrismaService.core_stations.count.mockResolvedValue(2);

      const result = await service.findAll('business-1', {});

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter stations by type', async () => {
      const mockStations = [
        { id: '1', code: 'ST-001', name: 'المحطة الرئيسية', type: 'generation_distribution', _count: {} },
      ];

      mockPrismaService.core_stations.findMany.mockResolvedValue(mockStations);
      mockPrismaService.core_stations.count.mockResolvedValue(1);

      const result = await service.findAll('business-1', { type: 'generation_distribution' as any });

      expect(result.data).toHaveLength(1);
    });

    it('should filter stations by search term', async () => {
      const mockStations = [
        { id: '1', code: 'ST-001', name: 'المحطة الرئيسية', _count: {} },
      ];

      mockPrismaService.core_stations.findMany.mockResolvedValue(mockStations);
      mockPrismaService.core_stations.count.mockResolvedValue(1);

      const result = await service.findAll('business-1', { search: 'رئيسية' });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a station by id', async () => {
      const mockStation = {
        id: '1',
        code: 'ST-001',
        name: 'المحطة الرئيسية',
        type: 'generation_distribution',
        businessId: 'business-1',
        _count: {},
      };

      mockPrismaService.core_stations.findFirst.mockResolvedValue(mockStation);

      const result = await service.findOne('business-1', '1');

      expect(result).toBeDefined();
      expect(result.code).toBe('ST-001');
    });

    it('should throw NotFoundException if station not found', async () => {
      mockPrismaService.core_stations.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('business-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new station', async () => {
      const createStationDto = {
        code: 'ST-003',
        name: 'محطة جديدة',
        type: 'distribution' as any,
        address: 'العنوان',
      };

      mockPrismaService.core_stations.findFirst.mockResolvedValue(null);
      mockPrismaService.core_stations.create.mockResolvedValue({
        id: '3',
        ...createStationDto,
        level: 1,
        _count: {},
      });

      const result = await service.create('business-1', createStationDto);

      expect(result).toBeDefined();
      expect(result.code).toBe('ST-003');
    });

    it('should throw ConflictException if station name already exists', async () => {
      const createStationDto = {
        name: 'محطة موجودة',
        type: 'distribution' as any,
      };

      mockPrismaService.core_stations.findFirst.mockResolvedValue({
        id: '1',
        name: 'محطة موجودة',
      });

      await expect(
        service.create('business-1', createStationDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if station code already exists', async () => {
      const createStationDto = {
        code: 'ST-001',
        name: 'محطة جديدة',
        type: 'distribution' as any,
      };

      mockPrismaService.core_stations.findFirst
        .mockResolvedValueOnce(null) // Name check
        .mockResolvedValueOnce({ id: '1', code: 'ST-001' }); // Code check

      await expect(
        service.create('business-1', createStationDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should create station with parent', async () => {
      const createStationDto = {
        name: 'محطة فرعية',
        type: 'distribution' as any,
        parentId: 'parent-1',
      };

      mockPrismaService.core_stations.findFirst
        .mockResolvedValueOnce(null) // Name check
        .mockResolvedValueOnce({ // Parent check
          id: 'parent-1',
          name: 'المحطة الرئيسية',
          level: 1,
        });
      mockPrismaService.core_stations.create.mockResolvedValue({
        id: '2',
        ...createStationDto,
        level: 2,
        _count: {},
      });

      const result = await service.create('business-1', createStationDto);

      expect(result.level).toBe(2);
    });

    it('should throw BadRequestException if parent not found', async () => {
      const createStationDto = {
        name: 'محطة فرعية',
        type: 'distribution' as any,
        parentId: 'non-existent',
      };

      mockPrismaService.core_stations.findFirst
        .mockResolvedValueOnce(null) // Name check
        .mockResolvedValueOnce(null); // Parent check

      await expect(
        service.create('business-1', createStationDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStationsTree', () => {
    it('should return stations as tree structure', async () => {
      const mockStations = [
        {
          id: '1',
          name: 'المحطة الرئيسية',
          parentId: null,
          children: [
            { id: '2', name: 'محطة فرعية', parentId: '1', children: [] },
          ],
          _count: {},
        },
      ];

      mockPrismaService.core_stations.findMany.mockResolvedValue(mockStations);

      const result = await service.getStationsTree('business-1');

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
    });
  });

  describe('getStationUsers', () => {
    it('should return users assigned to station', async () => {
      mockPrismaService.core_stations.findFirst.mockResolvedValue({
        id: '1',
        name: 'المحطة الرئيسية',
        businessId: 'business-1',
      });
      mockPrismaService.core_station_users.findMany.mockResolvedValue([
        {
          id: 'su-1',
          userId: 'user-1',
          stationId: '1',
          role: 'manager',
          isPrimary: true,
          user: { id: 'user-1', name: 'أحمد', email: 'ahmed@test.com' },
        },
      ]);

      const result = await service.getStationUsers('business-1', '1');

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('manager');
    });

    it('should throw NotFoundException if station not found', async () => {
      mockPrismaService.core_stations.findFirst.mockResolvedValue(null);

      await expect(
        service.getStationUsers('business-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addUserToStation', () => {
    it('should add user to station', async () => {
      mockPrismaService.core_stations.findFirst.mockResolvedValue({
        id: '1',
        name: 'المحطة الرئيسية',
        businessId: 'business-1',
      });
      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: 'user-1',
        name: 'أحمد',
        businessId: 'business-1',
        scopeType: 'station',
        scopeIds: [],
      });
      mockPrismaService.core_station_users.findFirst.mockResolvedValue(null);
      mockPrismaService.core_station_users.create.mockResolvedValue({
        id: 'su-1',
        userId: 'user-1',
        stationId: '1',
        role: 'employee',
        isPrimary: false,
        user: { id: 'user-1', name: 'أحمد' },
      });
      mockPrismaService.core_users.update.mockResolvedValue({});

      const result = await service.addUserToStation('business-1', '1', 'user-1', 'employee');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
    });

    it('should throw ConflictException if user already assigned', async () => {
      mockPrismaService.core_stations.findFirst.mockResolvedValue({
        id: '1',
        businessId: 'business-1',
      });
      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: 'user-1',
        businessId: 'business-1',
      });
      mockPrismaService.core_station_users.findFirst.mockResolvedValue({
        id: 'su-1',
        userId: 'user-1',
        stationId: '1',
      });

      await expect(
        service.addUserToStation('business-1', '1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeUserFromStation', () => {
    it('should remove user from station', async () => {
      mockPrismaService.core_stations.findFirst.mockResolvedValue({
        id: '1',
        businessId: 'business-1',
      });
      mockPrismaService.core_station_users.findFirst.mockResolvedValue({
        id: 'su-1',
        userId: 'user-1',
        stationId: '1',
      });
      mockPrismaService.core_station_users.delete.mockResolvedValue({});
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        id: 'user-1',
        scopeType: 'station',
        scopeIds: ['1'],
      });
      mockPrismaService.core_users.update.mockResolvedValue({});

      const result = await service.removeUserFromStation('business-1', '1', 'user-1');

      expect(result.message).toBe('تم إزالة المستخدم من المحطة بنجاح');
    });

    it('should throw NotFoundException if user not assigned', async () => {
      mockPrismaService.core_stations.findFirst.mockResolvedValue({
        id: '1',
        businessId: 'business-1',
      });
      mockPrismaService.core_station_users.findFirst.mockResolvedValue(null);

      await expect(
        service.removeUserFromStation('business-1', '1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
