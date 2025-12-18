import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  const mockPrismaService = {
    core_audit_logs: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('logCreate', () => {
    it('should create audit log for create action', async () => {
      mockPrismaService.core_audit_logs.create.mockResolvedValue({ id: '1' });
      await expect(service.logCreate('u1', 'b1', 'User', '1', {}, 'Created user')).resolves.not.toThrow();
    });
  });
});
