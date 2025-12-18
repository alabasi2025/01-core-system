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

export interface PermissionGroupDto {
  module: string;
  moduleName: string;
  moduleNameEn: string;
  permissions: PermissionDto[];
}

// Module names for grouping
export const MODULE_NAMES: Record<string, { ar: string; en: string }> = {
  'users': { ar: 'إدارة المستخدمين', en: 'User Management' },
  'roles': { ar: 'إدارة الأدوار', en: 'Role Management' },
  'permissions': { ar: 'إدارة الصلاحيات', en: 'Permission Management' },
  'businesses': { ar: 'إدارة المجموعة', en: 'Business Management' },
  'stations': { ar: 'إدارة المحطات', en: 'Station Management' },
  'accounts': { ar: 'شجرة الحسابات', en: 'Chart of Accounts' },
  'journal-entries': { ar: 'القيود اليومية', en: 'Journal Entries' },
  'accounting-periods': { ar: 'الفترات المحاسبية', en: 'Accounting Periods' },
  'reconciliation': { ar: 'التسويات', en: 'Reconciliation' },
  'payment-orders': { ar: 'أوامر الدفع', en: 'Payment Orders' },
  'custody': { ar: 'العهد المالية', en: 'Financial Custody' },
  'collection': { ar: 'التحصيل', en: 'Collection' },
  'services': { ar: 'كتالوج الخدمات', en: 'Service Catalog' },
  'customers': { ar: 'إدارة العملاء', en: 'Customer Management' },
  'reports': { ar: 'التقارير', en: 'Reports' },
  'settings': { ar: 'الإعدادات', en: 'Settings' },
  'audit': { ar: 'سجل التدقيق', en: 'Audit Log' },
  'dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
};

// Define all system permissions (60+ permissions)
export const SYSTEM_PERMISSIONS = [
  // ============ Users Module ============
  { module: 'users', action: 'create', name: 'إنشاء مستخدم', nameEn: 'Create User', description: 'إنشاء مستخدم جديد في النظام' },
  { module: 'users', action: 'read', name: 'عرض المستخدمين', nameEn: 'View Users', description: 'عرض قائمة المستخدمين وبياناتهم' },
  { module: 'users', action: 'update', name: 'تعديل مستخدم', nameEn: 'Update User', description: 'تعديل بيانات المستخدمين' },
  { module: 'users', action: 'delete', name: 'حذف مستخدم', nameEn: 'Delete User', description: 'حذف مستخدم من النظام' },
  { module: 'users', action: 'assign-roles', name: 'تعيين أدوار', nameEn: 'Assign Roles', description: 'تعيين أدوار للمستخدمين' },
  { module: 'users', action: 'reset-password', name: 'إعادة تعيين كلمة المرور', nameEn: 'Reset Password', description: 'إعادة تعيين كلمة مرور المستخدم' },
  { module: 'users', action: 'activate', name: 'تفعيل/تعطيل مستخدم', nameEn: 'Activate/Deactivate User', description: 'تفعيل أو تعطيل حساب المستخدم' },

  // ============ Roles Module ============
  { module: 'roles', action: 'create', name: 'إنشاء دور', nameEn: 'Create Role', description: 'إنشاء دور جديد' },
  { module: 'roles', action: 'read', name: 'عرض الأدوار', nameEn: 'View Roles', description: 'عرض قائمة الأدوار' },
  { module: 'roles', action: 'update', name: 'تعديل دور', nameEn: 'Update Role', description: 'تعديل بيانات الدور' },
  { module: 'roles', action: 'delete', name: 'حذف دور', nameEn: 'Delete Role', description: 'حذف دور من النظام' },
  { module: 'roles', action: 'assign-permissions', name: 'تعيين صلاحيات', nameEn: 'Assign Permissions', description: 'تعيين صلاحيات للدور' },

  // ============ Permissions Module ============
  { module: 'permissions', action: 'read', name: 'عرض الصلاحيات', nameEn: 'View Permissions', description: 'عرض قائمة الصلاحيات المتاحة' },
  { module: 'permissions', action: 'manage', name: 'إدارة الصلاحيات', nameEn: 'Manage Permissions', description: 'إدارة صلاحيات النظام' },

  // ============ Businesses Module ============
  { module: 'businesses', action: 'read', name: 'عرض بيانات المجموعة', nameEn: 'View Business', description: 'عرض بيانات المجموعة' },
  { module: 'businesses', action: 'update', name: 'تعديل بيانات المجموعة', nameEn: 'Update Business', description: 'تعديل بيانات المجموعة' },
  { module: 'businesses', action: 'manage-settings', name: 'إدارة إعدادات المجموعة', nameEn: 'Manage Business Settings', description: 'إدارة إعدادات المجموعة' },

  // ============ Stations Module ============
  { module: 'stations', action: 'create', name: 'إنشاء محطة', nameEn: 'Create Station', description: 'إنشاء محطة جديدة' },
  { module: 'stations', action: 'read', name: 'عرض المحطات', nameEn: 'View Stations', description: 'عرض قائمة المحطات' },
  { module: 'stations', action: 'update', name: 'تعديل محطة', nameEn: 'Update Station', description: 'تعديل بيانات المحطة' },
  { module: 'stations', action: 'delete', name: 'حذف محطة', nameEn: 'Delete Station', description: 'حذف محطة من النظام' },
  { module: 'stations', action: 'manage-staff', name: 'إدارة موظفي المحطة', nameEn: 'Manage Station Staff', description: 'إدارة موظفي المحطة' },
  { module: 'stations', action: 'view-statistics', name: 'عرض إحصائيات المحطة', nameEn: 'View Station Statistics', description: 'عرض إحصائيات المحطة' },

  // ============ Accounts (Chart of Accounts) Module ============
  { module: 'accounts', action: 'create', name: 'إنشاء حساب', nameEn: 'Create Account', description: 'إنشاء حساب جديد في شجرة الحسابات' },
  { module: 'accounts', action: 'read', name: 'عرض الحسابات', nameEn: 'View Accounts', description: 'عرض شجرة الحسابات' },
  { module: 'accounts', action: 'update', name: 'تعديل حساب', nameEn: 'Update Account', description: 'تعديل بيانات الحساب' },
  { module: 'accounts', action: 'delete', name: 'حذف حساب', nameEn: 'Delete Account', description: 'حذف حساب من الشجرة' },
  { module: 'accounts', action: 'view-balance', name: 'عرض رصيد الحساب', nameEn: 'View Account Balance', description: 'عرض رصيد الحساب' },
  { module: 'accounts', action: 'view-statement', name: 'عرض كشف الحساب', nameEn: 'View Account Statement', description: 'عرض كشف حساب تفصيلي' },

  // ============ Journal Entries Module ============
  { module: 'journal-entries', action: 'create', name: 'إنشاء قيد', nameEn: 'Create Journal Entry', description: 'إنشاء قيد يومي جديد' },
  { module: 'journal-entries', action: 'read', name: 'عرض القيود', nameEn: 'View Journal Entries', description: 'عرض القيود اليومية' },
  { module: 'journal-entries', action: 'update', name: 'تعديل قيد', nameEn: 'Update Journal Entry', description: 'تعديل قيد يومي' },
  { module: 'journal-entries', action: 'delete', name: 'حذف قيد', nameEn: 'Delete Journal Entry', description: 'حذف قيد يومي' },
  { module: 'journal-entries', action: 'post', name: 'ترحيل قيد', nameEn: 'Post Journal Entry', description: 'ترحيل قيد يومي' },
  { module: 'journal-entries', action: 'void', name: 'إلغاء قيد', nameEn: 'Void Journal Entry', description: 'إلغاء قيد مرحّل' },
  { module: 'journal-entries', action: 'approve', name: 'اعتماد قيد', nameEn: 'Approve Journal Entry', description: 'اعتماد قيد يومي' },
  { module: 'journal-entries', action: 'reverse', name: 'عكس قيد', nameEn: 'Reverse Journal Entry', description: 'إنشاء قيد عكسي' },

  // ============ Accounting Periods Module ============
  { module: 'accounting-periods', action: 'create', name: 'إنشاء فترة محاسبية', nameEn: 'Create Accounting Period', description: 'إنشاء فترة محاسبية جديدة' },
  { module: 'accounting-periods', action: 'read', name: 'عرض الفترات المحاسبية', nameEn: 'View Accounting Periods', description: 'عرض الفترات المحاسبية' },
  { module: 'accounting-periods', action: 'close', name: 'إقفال فترة محاسبية', nameEn: 'Close Accounting Period', description: 'إقفال فترة محاسبية' },
  { module: 'accounting-periods', action: 'reopen', name: 'إعادة فتح فترة', nameEn: 'Reopen Accounting Period', description: 'إعادة فتح فترة محاسبية مقفلة' },

  // ============ Reconciliation Module ============
  { module: 'reconciliation', action: 'create', name: 'إنشاء تسوية', nameEn: 'Create Reconciliation', description: 'إنشاء تسوية جديدة' },
  { module: 'reconciliation', action: 'read', name: 'عرض التسويات', nameEn: 'View Reconciliations', description: 'عرض التسويات' },
  { module: 'reconciliation', action: 'approve', name: 'اعتماد تسوية', nameEn: 'Approve Reconciliation', description: 'اعتماد تسوية' },
  { module: 'reconciliation', action: 'void', name: 'إلغاء تسوية', nameEn: 'Void Reconciliation', description: 'إلغاء تسوية' },
  { module: 'reconciliation', action: 'manage-panels', name: 'إدارة ألواح التسوية', nameEn: 'Manage Reconciliation Panels', description: 'إدارة ألواح التسوية المرنة' },

  // ============ Payment Orders Module ============
  { module: 'payment-orders', action: 'create', name: 'إنشاء أمر دفع', nameEn: 'Create Payment Order', description: 'إنشاء أمر دفع جديد' },
  { module: 'payment-orders', action: 'read', name: 'عرض أوامر الدفع', nameEn: 'View Payment Orders', description: 'عرض أوامر الدفع' },
  { module: 'payment-orders', action: 'approve', name: 'اعتماد أمر دفع', nameEn: 'Approve Payment Order', description: 'اعتماد أمر دفع' },
  { module: 'payment-orders', action: 'execute', name: 'تنفيذ أمر دفع', nameEn: 'Execute Payment Order', description: 'تنفيذ أمر دفع' },
  { module: 'payment-orders', action: 'void', name: 'إلغاء أمر دفع', nameEn: 'Void Payment Order', description: 'إلغاء أمر دفع' },

  // ============ Custody Module ============
  { module: 'custody', action: 'create', name: 'إنشاء عهدة', nameEn: 'Create Custody', description: 'إنشاء عهدة مالية جديدة' },
  { module: 'custody', action: 'read', name: 'عرض العهد', nameEn: 'View Custodies', description: 'عرض العهد المالية' },
  { module: 'custody', action: 'settle', name: 'تسوية عهدة', nameEn: 'Settle Custody', description: 'تسوية عهدة مالية' },
  { module: 'custody', action: 'approve', name: 'اعتماد عهدة', nameEn: 'Approve Custody', description: 'اعتماد عهدة مالية' },

  // ============ Collection Module ============
  { module: 'collection', action: 'create', name: 'إنشاء تحصيل', nameEn: 'Create Collection', description: 'إنشاء عملية تحصيل' },
  { module: 'collection', action: 'read', name: 'عرض التحصيلات', nameEn: 'View Collections', description: 'عرض عمليات التحصيل' },
  { module: 'collection', action: 'deposit', name: 'إيداع تحصيل', nameEn: 'Deposit Collection', description: 'إيداع مبالغ التحصيل' },
  { module: 'collection', action: 'manage-box', name: 'إدارة صندوق التحصيل', nameEn: 'Manage Collection Box', description: 'إدارة صندوق التحصيل' },

  // ============ Services Catalog Module ============
  { module: 'services', action: 'create', name: 'إنشاء خدمة', nameEn: 'Create Service', description: 'إنشاء خدمة جديدة في الكتالوج' },
  { module: 'services', action: 'read', name: 'عرض الخدمات', nameEn: 'View Services', description: 'عرض كتالوج الخدمات' },
  { module: 'services', action: 'update', name: 'تعديل خدمة', nameEn: 'Update Service', description: 'تعديل بيانات الخدمة' },
  { module: 'services', action: 'delete', name: 'حذف خدمة', nameEn: 'Delete Service', description: 'حذف خدمة من الكتالوج' },
  { module: 'services', action: 'manage-pricing', name: 'إدارة التسعير', nameEn: 'Manage Pricing', description: 'إدارة أسعار الخدمات' },

  // ============ Customers Module ============
  { module: 'customers', action: 'create', name: 'إنشاء عميل', nameEn: 'Create Customer', description: 'إنشاء عميل جديد' },
  { module: 'customers', action: 'read', name: 'عرض العملاء', nameEn: 'View Customers', description: 'عرض قائمة العملاء' },
  { module: 'customers', action: 'update', name: 'تعديل عميل', nameEn: 'Update Customer', description: 'تعديل بيانات العميل' },
  { module: 'customers', action: 'delete', name: 'حذف عميل', nameEn: 'Delete Customer', description: 'حذف عميل' },
  { module: 'customers', action: 'view-balance', name: 'عرض رصيد العميل', nameEn: 'View Customer Balance', description: 'عرض رصيد العميل' },

  // ============ Reports Module ============
  { module: 'reports', action: 'financial', name: 'التقارير المالية', nameEn: 'Financial Reports', description: 'عرض التقارير المالية' },
  { module: 'reports', action: 'operational', name: 'التقارير التشغيلية', nameEn: 'Operational Reports', description: 'عرض التقارير التشغيلية' },
  { module: 'reports', action: 'trial-balance', name: 'ميزان المراجعة', nameEn: 'Trial Balance', description: 'عرض ميزان المراجعة' },
  { module: 'reports', action: 'income-statement', name: 'قائمة الدخل', nameEn: 'Income Statement', description: 'عرض قائمة الدخل' },
  { module: 'reports', action: 'balance-sheet', name: 'الميزانية العمومية', nameEn: 'Balance Sheet', description: 'عرض الميزانية العمومية' },
  { module: 'reports', action: 'export', name: 'تصدير التقارير', nameEn: 'Export Reports', description: 'تصدير التقارير' },

  // ============ Settings Module ============
  { module: 'settings', action: 'read', name: 'عرض الإعدادات', nameEn: 'View Settings', description: 'عرض إعدادات النظام' },
  { module: 'settings', action: 'update', name: 'تعديل الإعدادات', nameEn: 'Update Settings', description: 'تعديل إعدادات النظام' },
  { module: 'settings', action: 'manage-system', name: 'إدارة النظام', nameEn: 'Manage System', description: 'إدارة إعدادات النظام المتقدمة' },

  // ============ Audit Module ============
  { module: 'audit', action: 'read', name: 'عرض سجل التدقيق', nameEn: 'View Audit Log', description: 'عرض سجل التدقيق' },
  { module: 'audit', action: 'export', name: 'تصدير سجل التدقيق', nameEn: 'Export Audit Log', description: 'تصدير سجل التدقيق' },

  // ============ Dashboard Module ============
  { module: 'dashboard', action: 'view', name: 'عرض لوحة التحكم', nameEn: 'View Dashboard', description: 'عرض لوحة التحكم الرئيسية' },
  { module: 'dashboard', action: 'view-financial', name: 'عرض المؤشرات المالية', nameEn: 'View Financial KPIs', description: 'عرض المؤشرات المالية' },
  { module: 'dashboard', action: 'view-operational', name: 'عرض المؤشرات التشغيلية', nameEn: 'View Operational KPIs', description: 'عرض المؤشرات التشغيلية' },
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

  async findAllGrouped(): Promise<PermissionGroupDto[]> {
    const permissions = await this.findAll();
    const grouped: Record<string, PermissionDto[]> = {};

    for (const permission of permissions) {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    }

    return Object.entries(grouped).map(([module, perms]) => ({
      module,
      moduleName: MODULE_NAMES[module]?.ar || module,
      moduleNameEn: MODULE_NAMES[module]?.en || module,
      permissions: perms,
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

  async getModules(): Promise<{ module: string; name: string; nameEn: string }[]> {
    const permissions = await this.prisma.core_permissions.findMany({
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });

    return permissions.map((p) => ({
      module: p.module,
      name: MODULE_NAMES[p.module]?.ar || p.module,
      nameEn: MODULE_NAMES[p.module]?.en || p.module,
    }));
  }

  async seedPermissions(): Promise<{ created: number; existing: number; total: number }> {
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
        // Update existing permission with new data
        await this.prisma.core_permissions.update({
          where: { id: existingPermission.id },
          data: {
            name: permission.name,
            nameEn: permission.nameEn,
            description: permission.description,
          },
        });
        existing++;
      }
    }

    return { created, existing, total: SYSTEM_PERMISSIONS.length };
  }

  async getPermissionsByIds(ids: string[]): Promise<PermissionDto[]> {
    const permissions = await this.prisma.core_permissions.findMany({
      where: { id: { in: ids } },
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
}
