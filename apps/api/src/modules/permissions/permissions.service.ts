import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PermissionDto {
  id: string;
  module: string;
  action: string;
  name: string;
  nameEn?: string;
  description?: string;
}

// Define all system permissions
export const SYSTEM_PERMISSIONS = [
  // Users
  { module: 'users', action: 'create', name: 'إنشاء مستخدم', nameEn: 'Create User' },
  { module: 'users', action: 'read', name: 'عرض المستخدمين', nameEn: 'View Users' },
  { module: 'users', action: 'update', name: 'تعديل مستخدم', nameEn: 'Update User' },
  { module: 'users', action: 'delete', name: 'حذف مستخدم', nameEn: 'Delete User' },
  { module: 'users', action: 'assign-roles', name: 'تعيين أدوار', nameEn: 'Assign Roles' },

  // Roles
  { module: 'roles', action: 'create', name: 'إنشاء دور', nameEn: 'Create Role' },
  { module: 'roles', action: 'read', name: 'عرض الأدوار', nameEn: 'View Roles' },
  { module: 'roles', action: 'update', name: 'تعديل دور', nameEn: 'Update Role' },
  { module: 'roles', action: 'delete', name: 'حذف دور', nameEn: 'Delete Role' },
  { module: 'roles', action: 'assign-permissions', name: 'تعيين صلاحيات', nameEn: 'Assign Permissions' },

  // Businesses
  { module: 'businesses', action: 'read', name: 'عرض بيانات المجموعة', nameEn: 'View Business' },
  { module: 'businesses', action: 'update', name: 'تعديل بيانات المجموعة', nameEn: 'Update Business' },

  // Stations
  { module: 'stations', action: 'create', name: 'إنشاء محطة', nameEn: 'Create Station' },
  { module: 'stations', action: 'read', name: 'عرض المحطات', nameEn: 'View Stations' },
  { module: 'stations', action: 'update', name: 'تعديل محطة', nameEn: 'Update Station' },
  { module: 'stations', action: 'delete', name: 'حذف محطة', nameEn: 'Delete Station' },

  // Accounts (Chart of Accounts)
  { module: 'accounts', action: 'create', name: 'إنشاء حساب', nameEn: 'Create Account' },
  { module: 'accounts', action: 'read', name: 'عرض الحسابات', nameEn: 'View Accounts' },
  { module: 'accounts', action: 'update', name: 'تعديل حساب', nameEn: 'Update Account' },
  { module: 'accounts', action: 'delete', name: 'حذف حساب', nameEn: 'Delete Account' },

  // Journal Entries
  { module: 'journal-entries', action: 'create', name: 'إنشاء قيد', nameEn: 'Create Journal Entry' },
  { module: 'journal-entries', action: 'read', name: 'عرض القيود', nameEn: 'View Journal Entries' },
  { module: 'journal-entries', action: 'update', name: 'تعديل قيد', nameEn: 'Update Journal Entry' },
  { module: 'journal-entries', action: 'delete', name: 'حذف قيد', nameEn: 'Delete Journal Entry' },
  { module: 'journal-entries', action: 'post', name: 'ترحيل قيد', nameEn: 'Post Journal Entry' },
  { module: 'journal-entries', action: 'void', name: 'إلغاء قيد', nameEn: 'Void Journal Entry' },

  // Reports
  { module: 'reports', action: 'financial', name: 'التقارير المالية', nameEn: 'Financial Reports' },
  { module: 'reports', action: 'operational', name: 'التقارير التشغيلية', nameEn: 'Operational Reports' },

  // Settings
  { module: 'settings', action: 'read', name: 'عرض الإعدادات', nameEn: 'View Settings' },
  { module: 'settings', action: 'update', name: 'تعديل الإعدادات', nameEn: 'Update Settings' },
];

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PermissionDto[]> {
    const permissions = await this.prisma.core_permissions.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return permissions.map((p) => ({
      id: p.id,
      module: p.module,
      action: p.action,
      name: p.name,
      nameEn: p.nameEn || undefined,
      description: p.description || undefined,
    }));
  }

  async findByModule(module: string): Promise<PermissionDto[]> {
    const permissions = await this.prisma.core_permissions.findMany({
      where: { module },
      orderBy: { action: 'asc' },
    });

    return permissions.map((p) => ({
      id: p.id,
      module: p.module,
      action: p.action,
      name: p.name,
      nameEn: p.nameEn || undefined,
      description: p.description || undefined,
    }));
  }

  async getModules(): Promise<string[]> {
    const permissions = await this.prisma.core_permissions.findMany({
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });

    return permissions.map((p) => p.module);
  }

  async seedPermissions(): Promise<{ created: number; existing: number }> {
    let created = 0;
    let existing = 0;

    for (const permission of SYSTEM_PERMISSIONS) {
      const existingPermission = await this.prisma.core_permissions.findFirst({
        where: { module: permission.module, action: permission.action },
      });

      if (!existingPermission) {
        await this.prisma.core_permissions.create({
          data: permission,
        });
        created++;
      } else {
        existing++;
      }
    }

    return { created, existing };
  }
}
