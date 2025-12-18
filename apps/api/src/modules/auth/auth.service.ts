import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ChangePasswordDto, AuthResponseDto, TokenResponseDto, UserResponseDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingUser = await this.prisma.core_users.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create business and user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create business
      const business = await tx.core_businesses.create({
        data: {
          name: dto.businessName,
          nameEn: dto.businessNameEn,
        },
      });

      // Create owner role for this business
      const ownerRole = await tx.core_roles.create({
        data: {
          businessId: business.id,
          name: 'owner',
          nameEn: 'Owner',
          description: 'المالك - كل الصلاحيات',
          isSystem: true,
        },
      });

      // Create user
      const user = await tx.core_users.create({
        data: {
          businessId: business.id,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          isOwner: true,
          scopeType: 'business',
        },
      });

      // Assign owner role to user
      await tx.core_user_roles.create({
        data: {
          userId: user.id,
          roleId: ownerRole.id,
        },
      });

      return { user, business };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user.id, result.user.email, result.user.businessId);

    // Save refresh token
    await this.saveRefreshToken(result.user.id, tokens.refreshToken, ipAddress, userAgent);

    // Get user with roles
    const userWithRoles = await this.getUserWithRoles(result.user.id);

    return {
      user: this.formatUserResponse(userWithRoles),
      tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.prisma.core_users.findUnique({
      where: { email: dto.email },
      include: {
        business: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('الحساب غير مفعّل');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    // Update last login
    await this.prisma.core_users.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.businessId);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

    // Get user with roles
    const userWithRoles = await this.getUserWithRoles(user.id);

    return {
      user: this.formatUserResponse(userWithRoles),
      tokens,
    };
  }

  async refreshTokens(dto: RefreshTokenDto, ipAddress?: string, userAgent?: string): Promise<TokenResponseDto> {
    // Find refresh token
    const storedToken = await this.prisma.core_refresh_tokens.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh Token غير صالح');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh Token ملغي');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh Token منتهي الصلاحية');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('الحساب غير مفعّل');
    }

    // Revoke old refresh token
    await this.prisma.core_refresh_tokens.update({
      where: { id: storedToken.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.businessId,
    );

    // Save new refresh token
    await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken, ipAddress, userAgent);

    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<{ message: string }> {
    if (refreshToken) {
      // Revoke specific refresh token
      await this.prisma.core_refresh_tokens.updateMany({
        where: { userId, token: refreshToken },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.core_refresh_tokens.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    }

    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.core_users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.core_users.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens
    await this.prisma.core_refresh_tokens.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.getUserWithRoles(userId);
    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }
    return this.formatUserResponse(user);
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.core_users.findUnique({
      where: { id: userId },
      include: {
        business: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, businessId: string): Promise<TokenResponseDto> {
    const payload = { sub: userId, email, businessId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: 900, // 15 minutes
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: 604800, // 7 days in seconds
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  private async saveRefreshToken(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = this.calculateExpiry(expiresIn);

    await this.prisma.core_refresh_tokens.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  private calculateExpiry(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([smhd])$/);
    
    if (!match) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  private async getUserWithRoles(userId: string) {
    return this.prisma.core_users.findUnique({
      where: { id: userId },
      include: {
        business: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private formatUserResponse(user: any): UserResponseDto {
    const roles: string[] = user.userRoles?.map((ur: any) => ur.role.name as string) || [];
    const permissions: string[] = user.userRoles?.flatMap((ur: any) =>
      ur.role.rolePermissions?.map((rp: any) => `${rp.permission.module}:${rp.permission.action}`) || []
    ) || [];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      businessId: user.businessId,
      isOwner: user.isOwner,
      scopeType: user.scopeType,
      roles: [...new Set<string>(roles)],
      permissions: [...new Set<string>(permissions)],
    };
  }
}
