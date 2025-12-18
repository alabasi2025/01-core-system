import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockPrismaService = {
    core_users: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    core_businesses: { findUnique: jest.fn() },
    core_refresh_tokens: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  };
  const mockJwtService = { sign: jest.fn(), verify: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue('secret') };

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
    jest.clearAllMocks();
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
