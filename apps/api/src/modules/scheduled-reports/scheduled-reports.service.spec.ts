import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledReportsService } from './scheduled-reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';

describe('ScheduledReportsService', () => {
  let service: ScheduledReportsService;
  const mockPrismaService = {
    core_report_schedules: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  const mockReportsService = { getTrialBalance: jest.fn(), getIncomeStatement: jest.fn(), getBalanceSheet: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ReportsService, useValue: mockReportsService },
      ],
    }).compile();
    service = module.get<ScheduledReportsService>(ScheduledReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
