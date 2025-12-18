import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  const mockPrismaService = {
    core_settings: { findMany: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findAll', () => {
    it('should return settings', async () => {
      mockPrismaService.core_settings.findMany.mockResolvedValue([{ key: 'test', value: '1' }]);
      const result = await service.findAll('b1');
      expect(result).toBeDefined();
    });
  });
});
