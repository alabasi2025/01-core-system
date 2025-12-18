import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    core_users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    core_businesses: {
      create: jest.fn(),
    },
    core_roles: {
      create: jest.fn(),
    },
    core_user_roles: {
      create: jest.fn(),
    },
    core_refresh_tokens: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-uuid',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
      isActive: true,
      businessId: 'business-uuid',
      isOwner: false,
      userRoles: [
        {
          role: {
            id: 'role-uuid',
            name: 'admin',
            rolePermissions: [
              {
                permission: {
                  module: 'users',
                  action: 'read',
                },
              },
            ],
          },
        },
      ],
    };

    it('should successfully login with valid credentials', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('mock-token');
      mockPrismaService.core_refresh_tokens.create.mockResolvedValue({});
      mockPrismaService.core_users.update.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockPrismaService.core_users.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        include: expect.any(Object),
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      businessName: 'New Business',
    };

    it('should successfully register a new user', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      
      const mockCreatedUser = {
        id: 'new-user-uuid',
        email: registerDto.email,
        name: registerDto.name,
        businessId: 'new-business-uuid',
        isOwner: true,
        userRoles: [],
      };

      mockPrismaService.$transaction.mockImplementation(async (callback: (prisma: typeof mockPrismaService) => Promise<unknown>) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.core_businesses.create.mockResolvedValue({
        id: 'new-business-uuid',
        name: registerDto.businessName,
      });

      mockPrismaService.core_users.create.mockResolvedValue(mockCreatedUser);
      mockPrismaService.core_roles.create.mockResolvedValue({ id: 'owner-role-uuid' });
      mockPrismaService.core_user_roles.create.mockResolvedValue({});
      mockJwtService.signAsync.mockResolvedValue('mock-token');
      mockPrismaService.core_refresh_tokens.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should successfully refresh tokens', async () => {
      const mockStoredToken = {
        id: 'token-uuid',
        token: refreshTokenDto.refreshToken,
        userId: 'user-uuid',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-uuid',
          email: 'test@example.com',
          name: 'Test User',
          isActive: true,
          businessId: 'business-uuid',
          isOwner: false,
          userRoles: [],
        },
      };

      mockPrismaService.core_refresh_tokens.findFirst.mockResolvedValue(mockStoredToken);
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-uuid' });
      mockPrismaService.core_refresh_tokens.updateMany.mockResolvedValue({});
      mockJwtService.signAsync.mockResolvedValue('new-mock-token');
      mockPrismaService.core_refresh_tokens.create.mockResolvedValue({});

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockPrismaService.core_refresh_tokens.findFirst.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockPrismaService.core_refresh_tokens.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-uuid');

      expect(result).toEqual({ message: 'تم تسجيل الخروج بنجاح' });
      expect(mockPrismaService.core_refresh_tokens.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid', isRevoked: false },
        data: { isRevoked: true, revokedAt: expect.any(Date) },
      });
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    };

    it('should successfully change password', async () => {
      const mockUser = {
        id: 'user-uuid',
        passwordHash: 'old-hashed-password',
      };

      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockPrismaService.core_users.update.mockResolvedValue({});

      const result = await service.changePassword('user-uuid', changePasswordDto);

      expect(result).toEqual({ message: 'تم تغيير كلمة المرور بنجاح' });
    });

    it('should throw BadRequestException for incorrect current password', async () => {
      const mockUser = {
        id: 'user-uuid',
        passwordHash: 'old-hashed-password',
      };

      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('user-uuid', changePasswordDto)).rejects.toThrow(BadRequestException);
    });
  });
});
