import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    core_users: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
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
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens and user on successful login', async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        name: 'Test User',
        isActive: true,
        businessId: 'business-1',
        business: { id: 'business-1', name: 'Test Business' },
        userRoles: [
          {
            role: {
              name: 'admin',
              rolePermissions: [
                { permission: { module: 'users', action: 'view' } },
              ],
            },
          },
        ],
      };

      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.core_users.update.mockResolvedValue(mockUser);
      mockPrismaService.core_refresh_tokens.create.mockResolvedValue({});
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@test.com',
        password: 'Test@123',
      });

      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('user');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@test.com', password: 'Test@123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        isActive: true,
      };

      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'test@test.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        isActive: false,
      };

      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'test@test.com', password: 'Test@123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new business and user', async () => {
      const registerDto = {
        email: 'new@test.com',
        password: 'Test@123',
        name: 'New User',
        businessName: 'New Business',
        businessNameEn: 'New Business En',
        phone: '1234567890',
      };

      mockPrismaService.core_users.findUnique
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce({ // getUserWithRoles call
          id: 'user-1',
          email: 'new@test.com',
          name: 'New User',
          businessId: 'business-1',
          isOwner: true,
          scopeType: 'business',
          userRoles: [
            {
              role: {
                name: 'owner',
                rolePermissions: [],
              },
            },
          ],
        });
      mockPrismaService.core_businesses.create.mockResolvedValue({
        id: 'business-1',
        name: 'New Business',
      });
      mockPrismaService.core_roles.create.mockResolvedValue({
        id: 'role-1',
        name: 'owner',
      });
      mockPrismaService.core_users.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@test.com',
        name: 'New User',
        businessId: 'business-1',
        isOwner: true,
        userRoles: [],
      });
      mockPrismaService.core_user_roles.create.mockResolvedValue({});
      mockPrismaService.core_refresh_tokens.create.mockResolvedValue({});
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('user');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'existing@test.com',
      });

      await expect(
        service.register({
          email: 'existing@test.com',
          password: 'Test@123',
          name: 'User',
          businessName: 'Business',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens', async () => {
      const mockStoredToken = {
        id: 'token-1',
        token: 'valid-refresh-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-1',
          email: 'test@test.com',
          businessId: 'business-1',
          isActive: true,
        },
      };

      mockPrismaService.core_refresh_tokens.findUnique.mockResolvedValue(mockStoredToken);
      mockPrismaService.core_refresh_tokens.update.mockResolvedValue({});
      mockPrismaService.core_refresh_tokens.create.mockResolvedValue({});
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshTokens({
        refreshToken: 'valid-refresh-token',
      });

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException if token not found', async () => {
      mockPrismaService.core_refresh_tokens.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshTokens({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      mockPrismaService.core_refresh_tokens.findUnique.mockResolvedValue({
        id: 'token-1',
        token: 'revoked-token',
        isRevoked: true,
        user: { isActive: true },
      });

      await expect(
        service.refreshTokens({ refreshToken: 'revoked-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke specific refresh token', async () => {
      mockPrismaService.core_refresh_tokens.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-1', 'specific-token');

      expect(result.message).toBe('تم تسجيل الخروج بنجاح');
    });

    it('should revoke all refresh tokens if no specific token provided', async () => {
      mockPrismaService.core_refresh_tokens.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.logout('user-1');

      expect(result.message).toBe('تم تسجيل الخروج بنجاح');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hashedPassword = await bcrypt.hash('OldPassword@123', 10);
      const mockUser = {
        id: 'user-1',
        passwordHash: hashedPassword,
      };

      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.core_users.update.mockResolvedValue({});
      mockPrismaService.core_refresh_tokens.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.changePassword('user-1', {
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123',
      });

      expect(result.message).toBe('تم تغيير كلمة المرور بنجاح');
    });

    it('should throw BadRequestException if current password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: hashedPassword,
      });

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword@123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user not found', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('non-existent', {
          currentPassword: 'Password',
          newPassword: 'NewPassword',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        businessId: 'business-1',
        isOwner: true,
        scopeType: 'business',
        userRoles: [
          {
            role: {
              name: 'admin',
              rolePermissions: [
                { permission: { module: 'users', action: 'view' } },
              ],
            },
          },
        ],
      };

      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result.email).toBe('test@test.com');
      expect(result.roles).toContain('admin');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if valid and active', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        isActive: true,
        business: { id: 'business-1' },
        userRoles: [],
      };

      mockPrismaService.core_users.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });

    it('should return null if user is inactive', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue({
        id: 'user-1',
        isActive: false,
      });

      const result = await service.validateUser('user-1');

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockPrismaService.core_users.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('non-existent');

      expect(result).toBeNull();
    });
  });
});
