import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  getInfo() {
    return {
      name: 'النظام الأم - Core System',
      version: '1.0.0',
      description: 'نظام إدارة الكهرباء - الوحدة الأساسية',
      modules: [
        'المصادقة (Authentication)',
        'المستخدمين والصلاحيات (RBAC)',
        'الهيكل التنظيمي (المحطات)',
        'شجرة الحسابات',
        'القيود اليومية',
      ],
      documentation: '/docs',
    };
  }
}
