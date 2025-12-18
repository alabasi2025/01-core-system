import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateJournalEntryDto, UpdateJournalEntryDto, JournalEntryQueryDto, JournalEntryResponseDto, PaginatedJournalEntriesDto, EntryStatus } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class JournalEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(businessId: string, userId: string, dto: CreateJournalEntryDto): Promise<JournalEntryResponseDto> {
    // Validate lines
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('القيد يجب أن يحتوي على سطرين على الأقل');
    }

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of dto.lines) {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;

      // Validate each line has either debit or credit, not both
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException('السطر لا يمكن أن يحتوي على مدين ودائن في نفس الوقت');
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new BadRequestException('السطر يجب أن يحتوي على مبلغ مدين أو دائن');
      }
    }

    // Validate balance
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException(`القيد غير متوازن: المدين (${totalDebit}) لا يساوي الدائن (${totalCredit})`);
    }

    // Validate all accounts exist and belong to business
    const accountIds = dto.lines.map((l) => l.accountId);
    const accounts = await this.prisma.core_accounts.findMany({
      where: { id: { in: accountIds }, businessId, isActive: true },
    });

    if (accounts.length !== accountIds.length) {
      throw new BadRequestException('بعض الحسابات غير موجودة أو غير نشطة');
    }

    // Validate accounts are not parent accounts
    const parentAccounts = accounts.filter((a) => a.isParent);
    if (parentAccounts.length > 0) {
      throw new BadRequestException('لا يمكن الترحيل على حسابات رئيسية');
    }

    // Validate station if provided
    if (dto.stationId) {
      const station = await this.prisma.core_stations.findFirst({
        where: { id: dto.stationId, businessId },
      });
      if (!station) {
        throw new NotFoundException('المحطة غير موجودة');
      }
    }

    // Validate accounting period is not closed
    const entryDate = new Date(dto.entryDate);
    const closedPeriod = await this.prisma.core_accounting_periods.findFirst({
      where: {
        businessId,
        startDate: { lte: entryDate },
        endDate: { gte: entryDate },
        isClosed: true,
      },
    });
    if (closedPeriod) {
      throw new BadRequestException(
        `لا يمكن إنشاء قيد في فترة محاسبية مغلقة (${closedPeriod.name})`
      );
    }

    // Generate entry number
    const entryNumber = await this.generateEntryNumber(businessId);

    // Create entry with lines
    const entry = await this.prisma.$transaction(async (tx) => {
      const newEntry = await tx.core_journal_entries.create({
        data: {
          businessId,
          stationId: dto.stationId,
          entryNumber,
          entryDate: new Date(dto.entryDate),
          description: dto.description,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          totalDebit: new Decimal(totalDebit),
          totalCredit: new Decimal(totalCredit),
          status: 'draft',
          createdBy: userId,
        },
      });

      // Create lines
      await tx.core_journal_entry_lines.createMany({
        data: dto.lines.map((line) => ({
          journalEntryId: newEntry.id,
          accountId: line.accountId,
          debit: new Decimal(line.debit || 0),
          credit: new Decimal(line.credit || 0),
          description: line.description,
        })),
      });

      return newEntry;
    });

    // Audit Log - تسجيل إنشاء القيد
    await this.auditService.logCreate(
      userId,
      businessId,
      'JournalEntry',
      entry.id,
      { entryNumber, totalDebit, totalCredit, description: dto.description },
      `إنشاء قيد يومي رقم ${entryNumber}`,
    );

    return this.findOne(businessId, entry.id);
  }

  async findAll(businessId: string, query: JournalEntryQueryDto): Promise<PaginatedJournalEntriesDto> {
    const { search, stationId, status, fromDate, toDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };

    if (search) {
      where.OR = [
        { entryNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stationId) {
      where.stationId = stationId;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.entryDate = {};
      if (fromDate) where.entryDate.gte = new Date(fromDate);
      if (toDate) where.entryDate.lte = new Date(toDate);
    }

    const [entries, total] = await Promise.all([
      this.prisma.core_journal_entries.findMany({
        where,
        skip,
        take: limit,
        include: {
          station: { select: { name: true } },
          creator: { select: { name: true } },
          poster: { select: { name: true } },
          lines: {
            include: {
              account: { select: { code: true, name: true } },
            },
          },
        },
        orderBy: [{ entryDate: 'desc' }, { entryNumber: 'desc' }],
      }),
      this.prisma.core_journal_entries.count({ where }),
    ]);

    return {
      data: entries.map((entry) => this.formatEntryResponse(entry)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(businessId: string, id: string): Promise<JournalEntryResponseDto> {
    const entry = await this.prisma.core_journal_entries.findFirst({
      where: { id, businessId },
      include: {
        station: { select: { name: true } },
        creator: { select: { name: true } },
        poster: { select: { name: true } },
        lines: {
          include: {
            account: { select: { code: true, name: true } },
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('القيد غير موجود');
    }

    return this.formatEntryResponse(entry);
  }

  async update(businessId: string, id: string, userId: string, dto: UpdateJournalEntryDto): Promise<JournalEntryResponseDto> {
    const entry = await this.prisma.core_journal_entries.findFirst({
      where: { id, businessId },
      include: { lines: true },
    });

    if (!entry) {
      throw new NotFoundException('القيد غير موجود');
    }

    if (entry.status !== 'draft') {
      throw new ForbiddenException('لا يمكن تعديل القيد بعد الترحيل');
    }

    const oldValue = {
      entryNumber: entry.entryNumber,
      totalDebit: Number(entry.totalDebit),
      totalCredit: Number(entry.totalCredit),
      description: entry.description,
    };

    // Validate and calculate if lines are provided
    let totalDebit = Number(entry.totalDebit);
    let totalCredit = Number(entry.totalCredit);

    if (dto.lines) {
      if (dto.lines.length < 2) {
        throw new BadRequestException('القيد يجب أن يحتوي على سطرين على الأقل');
      }

      totalDebit = 0;
      totalCredit = 0;
      for (const line of dto.lines) {
        totalDebit += line.debit || 0;
        totalCredit += line.credit || 0;

        if (line.debit > 0 && line.credit > 0) {
          throw new BadRequestException('السطر لا يمكن أن يحتوي على مدين ودائن في نفس الوقت');
        }
        if (line.debit === 0 && line.credit === 0) {
          throw new BadRequestException('السطر يجب أن يحتوي على مبلغ مدين أو دائن');
        }
      }

      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new BadRequestException(`القيد غير متوازن: المدين (${totalDebit}) لا يساوي الدائن (${totalCredit})`);
      }

      // Validate accounts
      const accountIds = dto.lines.map((l) => l.accountId);
      const accounts = await this.prisma.core_accounts.findMany({
        where: { id: { in: accountIds }, businessId, isActive: true, isParent: false },
      });

      if (accounts.length !== accountIds.length) {
        throw new BadRequestException('بعض الحسابات غير موجودة أو غير نشطة أو حسابات رئيسية');
      }
    }

    // Update entry
    await this.prisma.$transaction(async (tx) => {
      await tx.core_journal_entries.update({
        where: { id },
        data: {
          stationId: dto.stationId,
          entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
          description: dto.description,
          totalDebit: new Decimal(totalDebit),
          totalCredit: new Decimal(totalCredit),
        },
      });

      // Update lines if provided
      if (dto.lines) {
        await tx.core_journal_entry_lines.deleteMany({
          where: { journalEntryId: id },
        });

        await tx.core_journal_entry_lines.createMany({
          data: dto.lines.map((line) => ({
            journalEntryId: id,
            accountId: line.accountId,
            debit: new Decimal(line.debit || 0),
            credit: new Decimal(line.credit || 0),
            description: line.description,
          })),
        });
      }
    });

    // Audit Log - تسجيل تحديث القيد
    await this.auditService.logUpdate(
      userId,
      businessId,
      'JournalEntry',
      id,
      oldValue,
      { totalDebit, totalCredit, description: dto.description },
      `تحديث قيد يومي رقم ${entry.entryNumber}`,
    );

    return this.findOne(businessId, id);
  }

  async post(businessId: string, id: string, userId: string): Promise<JournalEntryResponseDto> {
    const entry = await this.prisma.core_journal_entries.findFirst({
      where: { id, businessId },
    });

    if (!entry) {
      throw new NotFoundException('القيد غير موجود');
    }

    if (entry.status !== 'draft') {
      throw new ForbiddenException('القيد مرحّل بالفعل');
    }

    await this.prisma.core_journal_entries.update({
      where: { id },
      data: {
        status: 'posted',
        postedBy: userId,
        postedAt: new Date(),
      },
    });

    // Audit Log - تسجيل ترحيل القيد
    await this.auditService.logPost(
      userId,
      businessId,
      'JournalEntry',
      id,
      { entryNumber: entry.entryNumber, totalDebit: Number(entry.totalDebit), totalCredit: Number(entry.totalCredit) },
      `ترحيل قيد يومي رقم ${entry.entryNumber}`,
    );

    return this.findOne(businessId, id);
  }

  async void(businessId: string, id: string, userId: string): Promise<JournalEntryResponseDto> {
    const entry = await this.prisma.core_journal_entries.findFirst({
      where: { id, businessId },
    });

    if (!entry) {
      throw new NotFoundException('القيد غير موجود');
    }

    if (entry.status === 'voided') {
      throw new ForbiddenException('القيد ملغي بالفعل');
    }

    await this.prisma.core_journal_entries.update({
      where: { id },
      data: { status: 'voided' },
    });

    // Audit Log - تسجيل إلغاء القيد
    await this.auditService.logVoid(
      userId,
      businessId,
      'JournalEntry',
      id,
      { entryNumber: entry.entryNumber, totalDebit: Number(entry.totalDebit), totalCredit: Number(entry.totalCredit) },
      `إلغاء قيد يومي رقم ${entry.entryNumber}`,
    );

    return this.findOne(businessId, id);
  }

  async remove(businessId: string, id: string, userId: string): Promise<{ message: string }> {
    const entry = await this.prisma.core_journal_entries.findFirst({
      where: { id, businessId },
    });

    if (!entry) {
      throw new NotFoundException('القيد غير موجود');
    }

    if (entry.status === 'posted') {
      throw new ForbiddenException('لا يمكن حذف القيد بعد الترحيل، يمكنك إلغاؤه فقط');
    }

    // Soft Delete
    await this.prisma.core_journal_entries.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    // Audit Log - تسجيل حذف القيد
    await this.auditService.logSoftDelete(
      userId,
      businessId,
      'JournalEntry',
      id,
      { entryNumber: entry.entryNumber, totalDebit: Number(entry.totalDebit), totalCredit: Number(entry.totalCredit) },
      `حذف قيد يومي رقم ${entry.entryNumber}`,
    );

    return { message: 'تم حذف القيد بنجاح' };
  }

  private async generateEntryNumber(businessId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;

    const lastEntry = await this.prisma.core_journal_entries.findFirst({
      where: {
        businessId,
        entryNumber: { startsWith: prefix },
      },
      orderBy: { entryNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastEntry) {
      const lastNumber = parseInt(lastEntry.entryNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private formatEntryResponse(entry: any): JournalEntryResponseDto {
    return {
      id: entry.id,
      businessId: entry.businessId,
      stationId: entry.stationId,
      stationName: entry.station?.name,
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate,
      description: entry.description,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      totalDebit: Number(entry.totalDebit),
      totalCredit: Number(entry.totalCredit),
      status: entry.status as EntryStatus,
      createdBy: entry.createdBy,
      createdByName: entry.creator?.name,
      postedBy: entry.postedBy,
      postedByName: entry.poster?.name,
      postedAt: entry.postedAt,
      createdAt: entry.createdAt,
      lines: entry.lines?.map((line: any) => ({
        id: line.id,
        accountId: line.accountId,
        accountCode: line.account?.code,
        accountName: line.account?.name,
        debit: Number(line.debit),
        credit: Number(line.credit),
        description: line.description,
      })) || [],
    };
  }
}
