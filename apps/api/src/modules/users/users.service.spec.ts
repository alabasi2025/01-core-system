import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    core_users: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    core_user_roles: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    core_roles: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', name: 'User 1', userRoles: [] },
        { id: '2', email: 'user2@test.com', name: 'User 2', userRoles: [] },
      ];

      mockPrismaService.core_users.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.core_users.count.mockResolvedValue(2);

      const result = await service.findAll('business-1', {});

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter users by search term', async () => {
      const mockUsers = [
        { id: '1', email: 'admin@test.com', name: 'Admin User', userRoles: [] },
      ];

      mockPrismaService.core_users.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.core_users.count.mockResolvedValue(1);

      const result = await service.findAll('business-1', { search: 'admin' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toContain('admin');
    });

    it('should filter users by active status', async () => {
      const mockUsers = [
        { id: '1', email: 'active@test.com', name: 'Active User', isActive: true, userRoles: [] },
      ];

      mockPrismaService.core_users.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.core_users.count.mockResolvedValue(1);

      const result = await service.findAll('business-1', { isActive: true });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        businessId: 'business-1',
        userRoles: [],
      };

      mockPrismaService.core_users.findFirst.mockResolvedValue(mockUser);

      const result = await service.findOne('business-1', '1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('business-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'new@test.com',
        password: 'Test@123',
        name: 'New User',
      };

      mockPrismaService.core_users.findUnique
        .mockResolvedValueOnce(null) // First call for email check
        .mockResolvedValueOnce({ // Second call for returning user
          id: '1',
          email: 'new@test.com',
          name: 'New User',
          userRoles: [],
        });
      mockPrismaService.core_users.create.mockResolvedValue({
        id: '1',
        ...createUserDto,
        passwordHash: 'hashed',
        userRoles: [],
      });

      const result = await service.create('business-1', createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe('new@test.com');
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto = {
        email: 'existing@test.com',
        password: 'Test@123',
        name: 'Existing User',
      };

      mockPrismaService.core_users.findUnique.mockResolvedValue({
        id: '1',
        email: 'existing@test.com',
      });

      await expect(
        service.create('business-1', createUserDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user with roles', async () => {
      const createUserDto = {
        email: 'new@test.com',
        password: 'Test@123',
        name: 'New User',
        roleIds: ['role-1', 'role-2'],
      };

      mockPrismaService.core_users.findUnique
        .mockResolvedValueOnce(null) // First call for email check
        .mockResolvedValueOnce({ // Second call for returning user
          id: '1',
          email: 'new@test.com',
          name: 'New User',
          userRoles: [
            { role: { id: 'role-1', name: 'admin' } },
            { role: { id: 'role-2', name: 'accountant' } },
          ],
        });
      mockPrismaService.core_users.create.mockResolvedValue({
        id: '1',
        ...createUserDto,
        userRoles: [],
      });
      mockPrismaService.core_user_roles.createMany.mockResolvedValue({ count: 2 });

      const result = await service.create('business-1', createUserDto);

      expect(result.roles).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const updateUserDto = {
        name: 'Updated Name',
      };

      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Old Name',
        businessId: 'business-1',
        isOwner: false,
      });
      mockPrismaService.core_users.update.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Updated Name',
      });
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Updated Name',
        userRoles: [],
      });

      const result = await service.update('business-1', '1', updateUserDto, 'admin-id');

      expect(result.name).toBe('Updated Name');
    });

    it('should throw ForbiddenException when deactivating owner', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: '1',
        email: 'owner@test.com',
        isOwner: true,
        businessId: 'business-1',
      });

      await expect(
        service.update('business-1', '1', { isActive: false }, 'admin-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: '1',
        email: 'old@test.com',
        businessId: 'business-1',
        isOwner: false,
      });
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        id: '2',
        email: 'existing@test.com',
      });

      await expect(
        service.update('business-1', '1', { email: 'existing@test.com' }, 'admin-id'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        businessId: 'business-1',
        isOwner: false,
      });
      mockPrismaService.core_users.delete.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });

      const result = await service.remove('business-1', '1', 'admin-id');

      expect(result.message).toBe('تم حذف المستخدم بنجاح');
    });

    it('should throw ForbiddenException when deleting owner', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: '1',
        email: 'owner@test.com',
        isOwner: true,
        businessId: 'business-1',
      });

      await expect(
        service.remove('business-1', '1', 'admin-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when deleting own account', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'self@test.com',
        isOwner: false,
        businessId: 'business-1',
      });

      await expect(
        service.remove('business-1', 'user-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('business-1', 'non-existent', 'admin-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to user', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        businessId: 'business-1',
      });
      mockPrismaService.core_roles.findMany.mockResolvedValue([
        { id: 'role-1', name: 'admin', businessId: 'business-1' },
        { id: 'role-2', name: 'accountant', businessId: 'business-1' },
      ]);
      mockPrismaService.core_user_roles.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.core_user_roles.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        userRoles: [
          { role: { id: 'role-1', name: 'admin' } },
          { role: { id: 'role-2', name: 'accountant' } },
        ],
      });

      const result = await service.assignRoles('business-1', '1', {
        roleIds: ['role-1', 'role-2'],
      });

      expect(result.roles).toHaveLength(2);
    });

    it('should throw NotFoundException if some roles not found', async () => {
      mockPrismaService.core_users.findFirst.mockResolvedValue({
        id: '1',
        businessId: 'business-1',
      });
      mockPrismaService.core_roles.findMany.mockResolvedValue([
        { id: 'role-1', name: 'admin', businessId: 'business-1' },
      ]);

      await expect(
        service.assignRoles('business-1', '1', {
          roleIds: ['role-1', 'role-2', 'role-3'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
