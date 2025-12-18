import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const STATION_SCOPE_KEY = 'stationScope';
export const RequireStationScope = () => Reflect.metadata(STATION_SCOPE_KEY, true);

/**
 * Guard للتحقق من أن المستخدم لديه صلاحية الوصول للمحطة المطلوبة
 * يتحقق من أن stationId في الطلب موجود ضمن scopeIds للمستخدم
 */
@Injectable()
export class StationScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireStationScope = this.reflector.getAllAndOverride<boolean>(STATION_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireStationScope) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('غير مصرح بالوصول');
    }

    // Owner has access to all stations
    if (user.isOwner) {
      return true;
    }

    // Global scope users have access to all stations
    if (user.scopeType === 'global') {
      return true;
    }

    // Get stationId from request (body, params, or query)
    const stationId = 
      request.body?.stationId || 
      request.params?.stationId || 
      request.query?.stationId;

    if (!stationId) {
      // No station specified, allow (other guards will handle)
      return true;
    }

    // Check if user has access to this station
    const userScopeIds = user.scopeIds || [];
    
    if (!userScopeIds.includes(stationId)) {
      throw new ForbiddenException('ليس لديك صلاحية الوصول لهذه المحطة');
    }

    return true;
  }
}
