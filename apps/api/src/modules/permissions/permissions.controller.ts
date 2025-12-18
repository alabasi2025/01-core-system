import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PermissionsService, PermissionDto } from './permissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('الصلاحيات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'الحصول على قائمة الصلاحيات' })
  @ApiResponse({ status: 200, description: 'قائمة الصلاحيات' })
  async findAll(): Promise<PermissionDto[]> {
    return this.permissionsService.findAll();
  }

  @Get('modules')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'الحصول على قائمة الوحدات' })
  @ApiResponse({ status: 200, description: 'قائمة الوحدات' })
  async getModules(): Promise<string[]> {
    return this.permissionsService.getModules();
  }

  @Get('module/:module')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'الحصول على صلاحيات وحدة معينة' })
  @ApiParam({ name: 'module', description: 'اسم الوحدة' })
  @ApiResponse({ status: 200, description: 'صلاحيات الوحدة' })
  async findByModule(@Param('module') module: string): Promise<PermissionDto[]> {
    return this.permissionsService.findByModule(module);
  }

  @Post('seed')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'إنشاء الصلاحيات الأساسية' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الصلاحيات' })
  async seedPermissions(): Promise<{ created: number; existing: number }> {
    return this.permissionsService.seedPermissions();
  }
}
