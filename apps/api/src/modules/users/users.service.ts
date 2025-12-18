import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto, AssignRolesDto, UserResponseDto, PaginatedUsersDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await this.prisma.core_users.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user with roles in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.core_users.create({
        data: {
          businessId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          scopeType: dto.scopeType || 'station',
          scopeIds: dto.scopeIds || [],
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // Assign roles if provided
      if (dto.roleIds && dto.roleIds.length > 0) {
        await tx.core_user_roles.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: newUser.id,
            roleId,
          })),
        });
      }

      return tx.core_users.findUnique({
        where: { id: newUser.id },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    return this.formatUserResponse(user);
  }

  async findAll(businessId: string, query: UserQueryDto): Promise<PaginatedUsersDto> {
    const { search, isActive, roleId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (roleId) {
      where.userRoles = {
        some: { roleId },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.core_users.findMany({
        where,
        skip,
        take: limit,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.core_users.count({ where }),
    ]);

    return {
      data: users.map((user) => this.formatUserResponse(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(businessId: string, id: string): Promise<UserResponseDto> {
    const user = await this.prisma.core_users.findFirst({
      where: { id, businessId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return this.formatUserResponse(user);
  }

  async update(businessId: string, id: string, dto: UpdateUserDto, currentUserId: string): Promise<UserResponseDto> {
    const user = await this.prisma.core_users.findFirst({
      where: { id, businessId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Prevent deactivating owner
    if (user.isOwner && dto.isActive === false) {
      throw new ForbiddenException('لا يمكن تعطيل حساب المالك');
    }

    // Check email uniqueness if changed
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.core_users.findUnique({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
      }
    }

    const updateData: any = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      scopeType: dto.scopeType,
      scopeIds: dto.scopeIds,
      isActive: dto.isActive,
    };

    // Hash new password if provided
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.core_users.update({
        where: { id },
        data: updateData,
      });

      // Update roles if provided
      if (dto.roleIds !== undefined) {
        await tx.core_user_roles.deleteMany({
          where: { userId: id },
        });

        if (dto.roleIds.length > 0) {
          await tx.core_user_roles.createMany({
            data: dto.roleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        }
      }

      return tx.core_users.findUnique({
        where: { id },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    return this.formatUserResponse(updatedUser);
  }

  async remove(businessId: string, id: string, currentUserId: string): Promise<{ message: string }> {
    const user = await this.prisma.core_users.findFirst({
      where: { id, businessId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.isOwner) {
      throw new ForbiddenException('لا يمكن حذف حساب المالك');
    }

    if (user.id === currentUserId) {
      throw new ForbiddenException('لا يمكنك حذف حسابك الخاص');
    }

    await this.prisma.core_users.delete({
      where: { id },
    });

    return { message: 'تم حذف المستخدم بنجاح' };
  }

  async assignRoles(businessId: string, userId: string, dto: AssignRolesDto): Promise<UserResponseDto> {
    const user = await this.prisma.core_users.findFirst({
      where: { id: userId, businessId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Verify all roles belong to the same business
    const roles = await this.prisma.core_roles.findMany({
      where: {
        id: { in: dto.roleIds },
        OR: [{ businessId }, { businessId: null }], // Include system roles
      },
    });

    if (roles.length !== dto.roleIds.length) {
      throw new NotFoundException('بعض الأدوار غير موجودة');
    }

    await this.prisma.$transaction(async (tx) => {
      // Remove existing roles
      await tx.core_user_roles.deleteMany({
        where: { userId },
      });

      // Assign new roles
      await tx.core_user_roles.createMany({
        data: dto.roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      });
    });

    const updatedUser = await this.prisma.core_users.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.formatUserResponse(updatedUser);
  }

  private formatUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      businessId: user.businessId,
      scopeType: user.scopeType,
      scopeIds: user.scopeIds as string[],
      isOwner: user.isOwner,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      roles: user.userRoles?.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
      })) || [],
    };
  }
}
