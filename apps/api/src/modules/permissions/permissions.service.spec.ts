import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  const mockPrismaService = {
    core_permissions: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<PermissionsService>(PermissionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findAll', () => {
    it('should return permissions', async () => {
      mockPrismaService.core_permissions.findMany.mockResolvedValue([{ id: '1', name: 'read' }]);
      const result = await service.findAll();
      expect(result).toBeDefined();
    });
  });
});
