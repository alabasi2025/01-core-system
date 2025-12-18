import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { ReportsService } from '../reports/reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ExportService', () => {
  let service: ExportService;
  let reportsService: ReportsService;

  const mockReportsService = {
    getTrialBalance: jest.fn(),
    getIncomeStatement: jest.fn(),
    getJournalBook: jest.fn(),
    getAgingReport: jest.fn(),
    getCollectionsReport: jest.fn(),
  };

  const mockPrismaService = {
    core_journal_entries: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: ReportsService, useValue: mockReportsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    reportsService = module.get<ReportsService>(ReportsService);

    jest.clearAllMocks();
  });

  describe('exportTrialBalanceToExcel', () => {
    it('يجب تصدير ميزان المراجعة إلى Excel بنجاح', async () => {
      const mockTrialBalance = {
        accounts: [
          { code: '1000', name: 'النقدية', debit: 50000, credit: 0, balance: 50000 },
          { code: '2000', name: 'الدائنون', debit: 0, credit: 30000, balance: -30000 },
        ],
        totalDebit: 50000,
        totalCredit: 30000,
      };

      mockReportsService.getTrialBalance.mockResolvedValue(mockTrialBalance);

      const result = await service.exportTrialBalanceToExcel(
        'business-123',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(mockReportsService.getTrialBalance).toHaveBeenCalledWith(
        'business-123',
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('يجب التعامل مع ميزان مراجعة فارغ', async () => {
      mockReportsService.getTrialBalance.mockResolvedValue({
        accounts: [],
        totalDebit: 0,
        totalCredit: 0,
      });

      const result = await service.exportTrialBalanceToExcel(
        'business-123',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportIncomeStatementToExcel', () => {
    it('يجب تصدير قائمة الدخل إلى Excel بنجاح', async () => {
      const mockIncomeStatement = {
        revenue: {
          accounts: [
            { code: '4000', name: 'إيرادات المبيعات', balance: 100000 },
          ],
          total: 100000,
        },
        expenses: {
          accounts: [
            { code: '5000', name: 'مصروفات الرواتب', balance: 40000 },
          ],
          total: 40000,
        },
        netIncome: 60000,
      };

      mockReportsService.getIncomeStatement.mockResolvedValue(mockIncomeStatement);

      const result = await service.exportIncomeStatementToExcel(
        'business-123',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(result).toBeInstanceOf(Buffer);
    });

    it('يجب التعامل مع صافي دخل سالب', async () => {
      mockReportsService.getIncomeStatement.mockResolvedValue({
        revenue: { accounts: [], total: 30000 },
        expenses: { accounts: [], total: 50000 },
        netIncome: -20000,
      });

      const result = await service.exportIncomeStatementToExcel(
        'business-123',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportJournalBookToExcel', () => {
    it('يجب تصدير دفتر اليومية إلى Excel بنجاح', async () => {
      const mockJournalBook = {
        entries: [
          {
            entryNumber: 'JE-001',
            entryDate: new Date('2024-01-15'),
            description: 'قيد تجريبي',
            lines: [
              { accountCode: '1000', accountName: 'النقدية', debit: 5000, credit: 0 },
              { accountCode: '4000', accountName: 'الإيرادات', debit: 0, credit: 5000 },
            ],
          },
        ],
        totalDebit: 5000,
        totalCredit: 5000,
      };

      mockReportsService.getJournalBook.mockResolvedValue(mockJournalBook);

      const result = await service.exportJournalBookToExcel(
        'business-123',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportAgingReportToExcel', () => {
    it('يجب تصدير تقرير أعمار الديون إلى Excel بنجاح', async () => {
      const mockAgingReport = {
        typeName: 'المدينون',
        details: [
          {
            accountCode: '1200',
            accountName: 'العملاء',
            current: 10000,
            days31_60: 5000,
            days61_90: 2000,
            days91_120: 1000,
            over120: 500,
            totalBalance: 18500,
          },
        ],
        summary: {
          current: 10000,
          days31_60: 5000,
          days61_90: 2000,
          days91_120: 1000,
          over120: 500,
          grandTotal: 18500,
        },
        riskAnalysis: {
          lowRisk: 15000,
          mediumRisk: 3000,
          highRisk: 500,
        },
      };

      mockReportsService.getAgingReport.mockResolvedValue(mockAgingReport);

      const result = await service.exportAgingReportToExcel(
        'business-123',
        'receivables',
        new Date('2024-12-31'),
      );

      expect(result).toBeInstanceOf(Buffer);
    });

    it('يجب تصدير تقرير الدائنين', async () => {
      mockReportsService.getAgingReport.mockResolvedValue({
        typeName: 'الدائنون',
        details: [],
        summary: {
          current: 0,
          days31_60: 0,
          days61_90: 0,
          days91_120: 0,
          over120: 0,
          grandTotal: 0,
        },
        riskAnalysis: { lowRisk: 0, mediumRisk: 0, highRisk: 0 },
      });

      const result = await service.exportAgingReportToExcel(
        'business-123',
        'payables',
        new Date('2024-12-31'),
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportCollectionsReportToExcel', () => {
    it('يجب تصدير تقرير التحصيلات إلى Excel بنجاح', async () => {
      const mockCollectionsReport = {
        collections: [
          {
            collectorName: 'أحمد محمد',
            totalAmount: 50000,
            count: 25,
            cashAmount: 30000,
            checkAmount: 20000,
          },
        ],
        summary: {
          totalAmount: 50000,
          totalCount: 25,
          byMethod: {
            cash: 30000,
            check: 20000,
          },
        },
      };

      mockReportsService.getCollectionsReport.mockResolvedValue(mockCollectionsReport);

      const result = await service.exportCollectionsReportToExcel(
        'business-123',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'collector',
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportJournalEntriesToExcel', () => {
    it('يجب تصدير القيود اليومية إلى Excel بنجاح', async () => {
      const mockEntries = [
        {
          entryNumber: 'JE-001',
          entryDate: new Date('2024-01-15'),
          description: 'قيد تجريبي',
          status: 'posted',
          totalDebit: 5000,
          totalCredit: 5000,
          lines: [
            { account: { code: '1000', name: 'النقدية' }, debit: 5000, credit: 0 },
            { account: { code: '4000', name: 'الإيرادات' }, debit: 0, credit: 5000 },
          ],
        },
      ];

      mockPrismaService.core_journal_entries.findMany.mockResolvedValue(mockEntries);

      const result = await service.exportJournalEntriesToExcel('business-123', {});

      expect(result).toBeInstanceOf(Buffer);
    });

    it('يجب تصفية القيود حسب الحالة', async () => {
      mockPrismaService.core_journal_entries.findMany.mockResolvedValue([]);

      await service.exportJournalEntriesToExcel('business-123', { status: 'posted' });

      expect(mockPrismaService.core_journal_entries.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'posted',
          }),
        }),
      );
    });

    it('يجب تصفية القيود حسب التاريخ', async () => {
      mockPrismaService.core_journal_entries.findMany.mockResolvedValue([]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.exportJournalEntriesToExcel('business-123', { startDate, endDate });

      expect(mockPrismaService.core_journal_entries.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entryDate: {
              gte: startDate,
              lte: endDate,
            },
          }),
        }),
      );
    });
  });
});
