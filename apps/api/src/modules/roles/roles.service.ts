import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto, RoleResponseDto, RoleQueryDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateRoleDto): Promise<RoleResponseDto> {
    // Check if role name already exists for this business
    const existingRole = await this.prisma.core_roles.findFirst({
      where: { businessId, name: dto.name },
    });

    if (existingRole) {
      throw new ConflictException('اسم الدور مستخدم بالفعل');
    }

    const role = await this.prisma.$transaction(async (tx) => {
      const newRole = await tx.core_roles.create({
        data: {
          businessId,
          name: dto.name,
          nameEn: dto.nameEn,
          description: dto.description,
          isSystem: false,
        },
      });

      // Assign permissions if provided
      if (dto.permissionIds && dto.permissionIds.length > 0) {
        await tx.core_role_permissions.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: newRole.id,
            permissionId,
          })),
        });
      }

      return tx.core_roles.findUnique({
        where: { id: newRole.id },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    return this.formatRoleResponse(role);
  }

  async findAll(businessId: string, query: RoleQueryDto): Promise<RoleResponseDto[]> {
    const where: any = {
      OR: [{ businessId }, { businessId: null }], // Include system roles
    };

    if (query.search) {
      where.AND = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { nameEn: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const roles = await this.prisma.core_roles.findMany({
      where,
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return roles.map((role) => this.formatRoleResponse(role));
  }

  async findOne(businessId: string, id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.core_roles.findFirst({
      where: {
        id,
        OR: [{ businessId }, { businessId: null }],
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    return this.formatRoleResponse(role);
  }

  async update(businessId: string, id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.prisma.core_roles.findFirst({
      where: { id, businessId },
    });

    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    if (role.isSystem) {
      throw new ForbiddenException('لا يمكن تعديل الأدوار النظامية');
    }

    // Check name uniqueness if changed
    if (dto.name && dto.name !== role.name) {
      const existingRole = await this.prisma.core_roles.findFirst({
        where: { businessId, name: dto.name, id: { not: id } },
      });
      if (existingRole) {
        throw new ConflictException('اسم الدور مستخدم بالفعل');
      }
    }

    const updatedRole = await this.prisma.$transaction(async (tx) => {
      await tx.core_roles.update({
        where: { id },
        data: {
          name: dto.name,
          nameEn: dto.nameEn,
          description: dto.description,
        },
      });

      // Update permissions if provided
      if (dto.permissionIds !== undefined) {
        await tx.core_role_permissions.deleteMany({
          where: { roleId: id },
        });

        if (dto.permissionIds.length > 0) {
          await tx.core_role_permissions.createMany({
            data: dto.permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      }

      return tx.core_roles.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    return this.formatRoleResponse(updatedRole);
  }

  async remove(businessId: string, id: string): Promise<{ message: string }> {
    const role = await this.prisma.core_roles.findFirst({
      where: { id, businessId },
    });

    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    if (role.isSystem) {
      throw new ForbiddenException('لا يمكن حذف الأدوار النظامية');
    }

    // Check if role is assigned to any users
    const usersWithRole = await this.prisma.core_user_roles.count({
      where: { roleId: id },
    });

    if (usersWithRole > 0) {
      throw new ConflictException(`لا يمكن حذف الدور لأنه مرتبط بـ ${usersWithRole} مستخدم`);
    }

    await this.prisma.core_roles.delete({
      where: { id },
    });

    return { message: 'تم حذف الدور بنجاح' };
  }

  async assignPermissions(businessId: string, roleId: string, dto: AssignPermissionsDto): Promise<RoleResponseDto> {
    const role = await this.prisma.core_roles.findFirst({
      where: { id: roleId, businessId },
    });

    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    if (role.isSystem) {
      throw new ForbiddenException('لا يمكن تعديل صلاحيات الأدوار النظامية');
    }

    // Verify all permissions exist
    const permissions = await this.prisma.core_permissions.findMany({
      where: { id: { in: dto.permissionIds } },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new NotFoundException('بعض الصلاحيات غير موجودة');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.core_role_permissions.deleteMany({
        where: { roleId },
      });

      await tx.core_role_permissions.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    });

    const updatedRole = await this.prisma.core_roles.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return this.formatRoleResponse(updatedRole);
  }

  private formatRoleResponse(role: any): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      nameEn: role.nameEn,
      description: role.description,
      isSystem: role.isSystem,
      businessId: role.businessId,
      createdAt: role.createdAt,
      permissions: role.rolePermissions?.map((rp: any) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        name: rp.permission.name,
      })) || [],
    };
  }
}
