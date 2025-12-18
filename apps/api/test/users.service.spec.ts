import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service';
import { PrismaService } from '../../../prisma/prisma.service';

// Mock bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    core_users: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    core_user_roles: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+967777123456',
    businessId: 'business-uuid',
    isActive: true,
    isOwner: false,
    scopeType: 'station',
    scopeIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    userRoles: [
      {
        role: {
          id: 'role-uuid',
          name: 'admin',
        },
      },
    ],
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

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users list', async () => {
      const mockUsers = [mockUser];
      mockPrismaService.core_users.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.core_users.count.mockResolvedValue(1);

      const result = await service.findAll('business-uuid', { page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result.data).toEqual(mockUsers);
      expect(result.total).toBe(1);
    });

    it('should filter users by search term', async () => {
      mockPrismaService.core_users.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.core_users.count.mockResolvedValue(1);

      await service.findAll('business-uuid', { page: 1, limit: 10, search: 'test' });

      expect(mockPrismaService.core_users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid', 'business-uuid');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.core_users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid', businessId: 'business-uuid' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-uuid', 'business-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createUserDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      phone: '+967777654321',
    };

    it('should create a new user', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrismaService.core_users.create.mockResolvedValue({
        ...mockUser,
        email: createUserDto.email,
        name: createUserDto.name,
      });

      const result = await service.create('business-uuid', createUserDto);

      expect(result).toHaveProperty('email', createUserDto.email);
      expect(mockPrismaService.core_users.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);

      await expect(service.create('business-uuid', createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateUserDto = {
      name: 'Updated Name',
      phone: '+967777999888',
    };

    it('should update a user', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.core_users.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      const result = await service.update('user-uuid', 'business-uuid', updateUserDto);

      expect(result.name).toBe(updateUserDto.name);
      expect(mockPrismaService.core_users.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-uuid', 'business-uuid', updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.core_users.delete.mockResolvedValue(mockUser);

      const result = await service.remove('user-uuid', 'business-uuid');

      expect(result).toEqual({ message: 'تم حذف المستخدم بنجاح' });
      expect(mockPrismaService.core_users.delete).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-uuid', 'business-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to delete owner', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        ...mockUser,
        isOwner: true,
      });

      await expect(service.remove('user-uuid', 'business-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignRoles', () => {
    const assignRolesDto = {
      roleIds: ['role-uuid-1', 'role-uuid-2'],
    };

    it('should assign roles to a user', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.$transaction.mockImplementation(async (callback: (prisma: typeof mockPrismaService) => Promise<unknown>) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.core_user_roles.deleteMany.mockResolvedValue({});
      mockPrismaService.core_user_roles.createMany.mockResolvedValue({ count: 2 });

      const result = await service.assignRoles('user-uuid', 'business-uuid', assignRolesDto);

      expect(result).toEqual({ message: 'تم تعيين الأدوار بنجاح' });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);

      await expect(service.assignRoles('invalid-uuid', 'business-uuid', assignRolesDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle user active status', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.core_users.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.toggleStatus('user-uuid', 'business-uuid');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.core_users.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        data: { isActive: false },
        include: expect.any(Object),
      });
    });

    it('should throw BadRequestException if trying to deactivate owner', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        ...mockUser,
        isOwner: true,
      });

      await expect(service.toggleStatus('user-uuid', 'business-uuid')).rejects.toThrow(BadRequestException);
    });
  });
});
