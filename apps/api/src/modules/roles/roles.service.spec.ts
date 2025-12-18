import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RolesService', () => {
  let service: RolesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    core_roles: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    core_role_permissions: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    core_user_roles: {
      count: jest.fn(),
    },
    core_permissions: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all roles for a business', async () => {
      const mockRoles = [
        { id: '1', name: 'admin', nameEn: 'Admin', isSystem: true, rolePermissions: [] },
        { id: '2', name: 'accountant', nameEn: 'Accountant', isSystem: false, rolePermissions: [] },
      ];

      mockPrismaService.core_roles.findMany.mockResolvedValue(mockRoles);

      const result = await service.findAll('business-1', {});

      expect(result).toHaveLength(2);
    });

    it('should filter roles by search term', async () => {
      const mockRoles = [
        { id: '1', name: 'admin', nameEn: 'Admin', rolePermissions: [] },
      ];

      mockPrismaService.core_roles.findMany.mockResolvedValue(mockRoles);

      const result = await service.findAll('business-1', { search: 'admin' });

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      const mockRole = {
        id: '1',
        name: 'admin',
        nameEn: 'Admin',
        businessId: 'business-1',
        rolePermissions: [],
      };

      mockPrismaService.core_roles.findFirst.mockResolvedValue(mockRole);

      const result = await service.findOne('business-1', '1');

      expect(result).toBeDefined();
      expect(result.name).toBe('admin');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('business-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto = {
        name: 'cashier',
        nameEn: 'Cashier',
        description: 'أمين صندوق',
      };

      mockPrismaService.core_roles.findFirst.mockResolvedValue(null);
      mockPrismaService.core_roles.create.mockResolvedValue({
        id: '3',
        ...createRoleDto,
        isSystem: false,
      });
      mockPrismaService.core_roles.findUnique.mockResolvedValue({
        id: '3',
        ...createRoleDto,
        isSystem: false,
        rolePermissions: [],
      });

      const result = await service.create('business-1', createRoleDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('cashier');
    });

    it('should throw ConflictException if role name already exists', async () => {
      const createRoleDto = {
        name: 'admin',
        nameEn: 'Admin',
      };

      mockPrismaService.core_roles.findFirst.mockResolvedValue({
        id: '1',
        name: 'admin',
      });

      await expect(
        service.create('business-1', createRoleDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should create role with permissions', async () => {
      const createRoleDto = {
        name: 'cashier',
        nameEn: 'Cashier',
        permissionIds: ['perm-1', 'perm-2'],
      };

      mockPrismaService.core_roles.findFirst.mockResolvedValue(null);
      mockPrismaService.core_roles.create.mockResolvedValue({
        id: '3',
        name: 'cashier',
        isSystem: false,
      });
      mockPrismaService.core_role_permissions.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.core_roles.findUnique.mockResolvedValue({
        id: '3',
        name: 'cashier',
        isSystem: false,
        rolePermissions: [
          { permission: { id: 'perm-1', module: 'cash_box', action: 'view' } },
          { permission: { id: 'perm-2', module: 'cash_box', action: 'create' } },
        ],
      });

      const result = await service.create('business-1', createRoleDto);

      expect(result.permissions).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update an existing role', async () => {
      const updateRoleDto = {
        nameEn: 'Updated Name',
      };

      mockPrismaService.core_roles.findFirst.mockResolvedValue({
        id: '2',
        name: 'accountant',
        nameEn: 'Accountant',
        isSystem: false,
        businessId: 'business-1',
      });
      mockPrismaService.core_roles.update.mockResolvedValue({
        id: '2',
        name: 'accountant',
        nameEn: 'Updated Name',
      });
      mockPrismaService.core_roles.findUnique.mockResolvedValue({
        id: '2',
        name: 'accountant',
        nameEn: 'Updated Name',
        rolePermissions: [],
      });

      const result = await service.update('business-1', '2', updateRoleDto);

      expect(result.nameEn).toBe('Updated Name');
    });

    it('should throw ForbiddenException if trying to update system role', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue({
        id: '1',
        name: 'admin',
        isSystem: true,
        businessId: 'business-1',
      });

      await expect(
        service.update('business-1', '1', { nameEn: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when name already exists', async () => {
      mockPrismaService.core_roles.findFirst
        .mockResolvedValueOnce({
          id: '2',
          name: 'accountant',
          isSystem: false,
          businessId: 'business-1',
        })
        .mockResolvedValueOnce({
          id: '3',
          name: 'cashier',
        });

      await expect(
        service.update('business-1', '2', { name: 'cashier' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a role', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue({
        id: '2',
        name: 'accountant',
        isSystem: false,
        businessId: 'business-1',
      });
      mockPrismaService.core_user_roles.count.mockResolvedValue(0);
      mockPrismaService.core_roles.delete.mockResolvedValue({
        id: '2',
        name: 'accountant',
      });

      const result = await service.remove('business-1', '2');

      expect(result.message).toBe('تم حذف الدور بنجاح');
    });

    it('should throw ForbiddenException if trying to delete system role', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue({
        id: '1',
        name: 'admin',
        isSystem: true,
        businessId: 'business-1',
      });

      await expect(
        service.remove('business-1', '1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if role has assigned users', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue({
        id: '2',
        name: 'accountant',
        isSystem: false,
        businessId: 'business-1',
      });
      mockPrismaService.core_user_roles.count.mockResolvedValue(5);

      await expect(
        service.remove('business-1', '2'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to role', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue({
        id: '2',
        name: 'accountant',
        isSystem: false,
        businessId: 'business-1',
      });
      mockPrismaService.core_permissions.findMany.mockResolvedValue([
        { id: 'perm-1', module: 'accounts', action: 'view' },
        { id: 'perm-2', module: 'accounts', action: 'create' },
      ]);
      mockPrismaService.core_role_permissions.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.core_role_permissions.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.core_roles.findUnique.mockResolvedValue({
        id: '2',
        name: 'accountant',
        rolePermissions: [
          { permission: { id: 'perm-1', module: 'accounts', action: 'view' } },
          { permission: { id: 'perm-2', module: 'accounts', action: 'create' } },
        ],
      });

      const result = await service.assignPermissions('business-1', '2', {
        permissionIds: ['perm-1', 'perm-2'],
      });

      expect(result.permissions).toHaveLength(2);
    });

    it('should throw ForbiddenException for system roles', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue({
        id: '1',
        name: 'admin',
        isSystem: true,
        businessId: 'business-1',
      });

      await expect(
        service.assignPermissions('business-1', '1', { permissionIds: ['perm-1'] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if some permissions not found', async () => {
      mockPrismaService.core_roles.findFirst.mockResolvedValue({
        id: '2',
        name: 'accountant',
        isSystem: false,
        businessId: 'business-1',
      });
      mockPrismaService.core_permissions.findMany.mockResolvedValue([
        { id: 'perm-1', module: 'accounts', action: 'view' },
      ]);

      await expect(
        service.assignPermissions('business-1', '2', {
          permissionIds: ['perm-1', 'perm-2', 'perm-3'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
