import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const AUDIT_KEY = 'audit';
export const Audit = (action: string) => Reflect.metadata(AUDIT_KEY, action);

/**
 * Interceptor لتسجيل العمليات الحساسة في سجل التدقيق
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditAction = this.reflector.get<string>(AUDIT_KEY, context.getHandler());

    if (!auditAction) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, params, query } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async (response) => {
          await this.logAudit({
            userId: user?.id,
            businessId: user?.businessId,
            action: auditAction,
            method,
            url,
            requestBody: this.sanitizeBody(body),
            requestParams: params,
            requestQuery: query,
            responseStatus: 'success',
            duration: Date.now() - startTime,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });
        },
        error: async (error) => {
          await this.logAudit({
            userId: user?.id,
            businessId: user?.businessId,
            action: auditAction,
            method,
            url,
            requestBody: this.sanitizeBody(body),
            requestParams: params,
            requestQuery: query,
            responseStatus: 'error',
            errorMessage: error.message,
            duration: Date.now() - startTime,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });
        },
      }),
    );
  }

  private async logAudit(data: {
    userId?: string;
    businessId?: string;
    action: string;
    method: string;
    url: string;
    requestBody?: any;
    requestParams?: any;
    requestQuery?: any;
    responseStatus: string;
    errorMessage?: string;
    duration: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.core_audit_logs.create({
        data: {
          userId: data.userId,
          businessId: data.businessId,
          action: data.action,
          tableName: this.extractTableName(data.url),
          recordId: data.requestParams?.id,
          oldValues: null,
          newValues: data.requestBody ? JSON.stringify(data.requestBody) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * إزالة البيانات الحساسة من body
   */
  private sanitizeBody(body: any): any {
    if (!body) return null;

    const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'refreshToken'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * استخراج اسم الجدول من URL
   */
  private extractTableName(url: string): string {
    const parts = url.split('/').filter(Boolean);
    // Remove api version prefix
    if (parts[0] === 'api' && parts[1]?.startsWith('v')) {
      parts.splice(0, 2);
    }
    return parts[0] || 'unknown';
  }
}
