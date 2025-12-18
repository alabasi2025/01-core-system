import { Test, TestingModule } from '@nestjs/testing';
import { ClearingService } from './clearing.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ClearingService', () => {
  let service: ClearingService;
  const mockPrismaService = {
    core_clearing_accounts: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    core_clearing_entries: { findMany: jest.fn(), create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClearingService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();
    service = module.get<ClearingService>(ClearingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
