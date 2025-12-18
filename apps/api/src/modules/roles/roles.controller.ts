import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto, RoleResponseDto, RoleQueryDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('الأدوار')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions('roles:create')
  @ApiOperation({ summary: 'إنشاء دور جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الدور بنجاح', type: RoleResponseDto })
  @ApiResponse({ status: 409, description: 'اسم الدور مستخدم بالفعل' })
  async create(
    @CurrentUser('businessId') businessId: string,
    @Body() dto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.create(businessId, dto);
  }

  @Get()
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'الحصول على قائمة الأدوار' })
  @ApiResponse({ status: 200, description: 'قائمة الأدوار', type: [RoleResponseDto] })
  async findAll(
    @CurrentUser('businessId') businessId: string,
    @Query() query: RoleQueryDto,
  ): Promise<RoleResponseDto[]> {
    return this.rolesService.findAll(businessId, query);
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'الحصول على بيانات دور' })
  @ApiParam({ name: 'id', description: 'معرف الدور' })
  @ApiResponse({ status: 200, description: 'بيانات الدور', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'الدور غير موجود' })
  async findOne(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
  ): Promise<RoleResponseDto> {
    return this.rolesService.findOne(businessId, id);
  }

  @Put(':id')
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'تحديث بيانات دور' })
  @ApiParam({ name: 'id', description: 'معرف الدور' })
  @ApiResponse({ status: 200, description: 'تم تحديث الدور بنجاح', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'الدور غير موجود' })
  @ApiResponse({ status: 403, description: 'لا يمكن تعديل الأدوار النظامية' })
  async update(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.update(businessId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('roles:delete')
  @ApiOperation({ summary: 'حذف دور' })
  @ApiParam({ name: 'id', description: 'معرف الدور' })
  @ApiResponse({ status: 200, description: 'تم حذف الدور بنجاح' })
  @ApiResponse({ status: 404, description: 'الدور غير موجود' })
  @ApiResponse({ status: 403, description: 'لا يمكن حذف الأدوار النظامية' })
  async remove(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.rolesService.remove(businessId, id);
  }

  @Post(':id/permissions')
  @RequirePermissions('roles:assign-permissions')
  @ApiOperation({ summary: 'تعيين صلاحيات للدور' })
  @ApiParam({ name: 'id', description: 'معرف الدور' })
  @ApiResponse({ status: 200, description: 'تم تعيين الصلاحيات بنجاح', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'الدور أو الصلاحيات غير موجودة' })
  async assignPermissions(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.assignPermissions(businessId, id, dto);
  }
}
