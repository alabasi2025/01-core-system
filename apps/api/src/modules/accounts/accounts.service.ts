import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { defaultAccountsTree, AccountSeed } from './accounts-seed';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto, AccountQueryDto, AccountResponseDto, AccountTreeDto, AccountType, AccountNature } from './dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateAccountDto): Promise<AccountResponseDto> {
    // Check if code already exists
    const existingAccount = await this.prisma.core_accounts.findFirst({
      where: { businessId, code: dto.code },
    });

    if (existingAccount) {
      throw new ConflictException('كود الحساب مستخدم بالفعل');
    }

    // Validate parent if provided
    let level = dto.level || 1;
    if (dto.parentId) {
      const parent = await this.prisma.core_accounts.findFirst({
        where: { id: dto.parentId, businessId },
      });

      if (!parent) {
        throw new NotFoundException('الحساب الأب غير موجود');
      }

      // Ensure parent type matches
      if (parent.type !== dto.type) {
        throw new BadRequestException('نوع الحساب يجب أن يتطابق مع نوع الحساب الأب');
      }

      level = parent.level + 1;

      // Update parent to be a parent account
      if (!parent.isParent) {
        await this.prisma.core_accounts.update({
          where: { id: dto.parentId },
          data: { isParent: true },
        });
      }
    }

    const account = await this.prisma.core_accounts.create({
      data: {
        businessId,
        parentId: dto.parentId,
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        type: dto.type,
        nature: dto.nature,
        level,
        isParent: dto.isParent || false,
        systemAccount: dto.systemAccount,
        description: dto.description,
      },
    });

    return this.formatAccountResponse(account);
  }

  async findAll(businessId: string, query: AccountQueryDto): Promise<AccountResponseDto[]> {
    const where: any = { businessId };

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { nameEn: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.parentId) {
      where.parentId = query.parentId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.leafOnly) {
      where.isParent = false;
    }

    const accounts = await this.prisma.core_accounts.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return accounts.map((account) => this.formatAccountResponse(account));
  }

  async getTree(businessId: string): Promise<AccountTreeDto> {
    const accounts = await this.prisma.core_accounts.findMany({
      where: { businessId, isActive: true },
      orderBy: { code: 'asc' },
    });

    const buildTree = (parentId: string | null, type: string): AccountResponseDto[] => {
      return accounts
        .filter((a) => a.parentId === parentId && a.type === type)
        .map((account) => ({
          ...this.formatAccountResponse(account),
          children: buildTree(account.id, type),
        }));
    };

    return {
      assets: buildTree(null, 'asset'),
      liabilities: buildTree(null, 'liability'),
      equity: buildTree(null, 'equity'),
      revenue: buildTree(null, 'revenue'),
      expenses: buildTree(null, 'expense'),
    };
  }

  async findOne(businessId: string, id: string): Promise<AccountResponseDto> {
    const account = await this.prisma.core_accounts.findFirst({
      where: { id, businessId },
      include: {
        children: {
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('الحساب غير موجود');
    }

    return {
      ...this.formatAccountResponse(account),
      children: account.children?.map((c) => this.formatAccountResponse(c)),
    };
  }

  async update(businessId: string, id: string, dto: UpdateAccountDto): Promise<AccountResponseDto> {
    const account = await this.prisma.core_accounts.findFirst({
      where: { id, businessId },
    });

    if (!account) {
      throw new NotFoundException('الحساب غير موجود');
    }

    // Check code uniqueness if changed
    if (dto.code && dto.code !== account.code) {
      const existingAccount = await this.prisma.core_accounts.findFirst({
        where: { businessId, code: dto.code, id: { not: id } },
      });
      if (existingAccount) {
        throw new ConflictException('كود الحساب مستخدم بالفعل');
      }
    }

    // Prevent changing type if account has children or transactions
    if (dto.type && dto.type !== account.type) {
      const hasChildren = await this.prisma.core_accounts.count({
        where: { parentId: id },
      });
      if (hasChildren > 0) {
        throw new BadRequestException('لا يمكن تغيير نوع الحساب لأنه يحتوي على حسابات فرعية');
      }

      const hasTransactions = await this.prisma.core_journal_entry_lines.count({
        where: { accountId: id },
      });
      if (hasTransactions > 0) {
        throw new BadRequestException('لا يمكن تغيير نوع الحساب لأنه يحتوي على معاملات');
      }
    }

    const updateData: any = {};
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.nature !== undefined) updateData.nature = dto.nature;
    if (dto.systemAccount !== undefined) updateData.systemAccount = dto.systemAccount;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updatedAccount = await this.prisma.core_accounts.update({
      where: { id },
      data: updateData,
    });

    return this.formatAccountResponse(updatedAccount);
  }

  async remove(businessId: string, id: string): Promise<{ message: string }> {
    const account = await this.prisma.core_accounts.findFirst({
      where: { id, businessId },
    });

    if (!account) {
      throw new NotFoundException('الحساب غير موجود');
    }

    // Check for children
    const hasChildren = await this.prisma.core_accounts.count({
      where: { parentId: id },
    });
    if (hasChildren > 0) {
      throw new ConflictException('لا يمكن حذف الحساب لأنه يحتوي على حسابات فرعية');
    }

    // Check for transactions
    const hasTransactions = await this.prisma.core_journal_entry_lines.count({
      where: { accountId: id },
    });
    if (hasTransactions > 0) {
      throw new ConflictException('لا يمكن حذف الحساب لأنه يحتوي على معاملات');
    }

    await this.prisma.core_accounts.delete({
      where: { id },
    });

    // Update parent if no more children
    if (account.parentId) {
      const siblingCount = await this.prisma.core_accounts.count({
        where: { parentId: account.parentId },
      });
      if (siblingCount === 0) {
        await this.prisma.core_accounts.update({
          where: { id: account.parentId },
          data: { isParent: false },
        });
      }
    }

    return { message: 'تم حذف الحساب بنجاح' };
  }

  async seedDefaultAccounts(businessId: string): Promise<{ created: number; updated: number }> {
    // استخدام شجرة الحسابات الافتراضية الكاملة
    const defaultAccounts: AccountSeed[] = defaultAccountsTree;


    // Create accounts with parent relationships
    const codeToId: Record<string, string> = {};
    let created = 0;
    let updated = 0;

    // حساب المستوى بناءً على الكود
    const calculateLevel = (code: string): number => {
      if (code.length === 1) return 1;
      if (code.length === 2) return 2;
      if (code.length === 3) return 3;
      return 4;
    };

    for (const acc of defaultAccounts) {
      const existing = await this.prisma.core_accounts.findFirst({
        where: { businessId, code: acc.code },
      });

      const parentId = acc.parentCode ? codeToId[acc.parentCode] : null;
      const level = calculateLevel(acc.code);

      if (!existing) {
        const newAccount = await this.prisma.core_accounts.create({
          data: {
            businessId,
            parentId,
            code: acc.code,
            name: acc.name,
            nameEn: acc.nameEn,
            type: acc.type as any,
            nature: acc.nature as any,
            level,
            isParent: acc.isParent || false,
            systemAccount: acc.systemAccount,
          },
        });
        codeToId[acc.code] = newAccount.id;
        created++;
      } else {
        // تحديث الحساب الموجود
        await this.prisma.core_accounts.update({
          where: { id: existing.id },
          data: {
            parentId,
            name: acc.name,
            nameEn: acc.nameEn,
            level,
            isParent: acc.isParent || false,
            systemAccount: acc.systemAccount,
          },
        });
        codeToId[acc.code] = existing.id;
        updated++;
      }
    }

    return { created, updated };
  }

  private formatAccountResponse(account: any): AccountResponseDto {
    return {
      id: account.id,
      businessId: account.businessId,
      parentId: account.parentId,
      code: account.code,
      name: account.name,
      nameEn: account.nameEn,
      type: account.type as AccountType,
      nature: account.nature as AccountNature,
      level: account.level,
      isParent: account.isParent,
      isActive: account.isActive,
      systemAccount: account.systemAccount,
      description: account.description,
      createdAt: account.createdAt,
    };
  }
}
