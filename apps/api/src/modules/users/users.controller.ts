import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto, AssignRolesDto, UserResponseDto, PaginatedUsersDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('المستخدمين')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('users:create')
  @ApiOperation({ summary: 'إنشاء مستخدم جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء المستخدم بنجاح', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'البريد الإلكتروني مستخدم بالفعل' })
  async create(
    @CurrentUser('businessId') businessId: string,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(businessId, dto);
  }

  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'الحصول على قائمة المستخدمين' })
  @ApiResponse({ status: 200, description: 'قائمة المستخدمين', type: PaginatedUsersDto })
  async findAll(
    @CurrentUser('businessId') businessId: string,
    @Query() query: UserQueryDto,
  ): Promise<PaginatedUsersDto> {
    return this.usersService.findAll(businessId, query);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'الحصول على بيانات مستخدم' })
  @ApiParam({ name: 'id', description: 'معرف المستخدم' })
  @ApiResponse({ status: 200, description: 'بيانات المستخدم', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  async findOne(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(businessId, id);
  }

  @Put(':id')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'تحديث بيانات مستخدم' })
  @ApiParam({ name: 'id', description: 'معرف المستخدم' })
  @ApiResponse({ status: 200, description: 'تم تحديث المستخدم بنجاح', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(user.businessId, id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  @ApiOperation({ summary: 'حذف مستخدم' })
  @ApiParam({ name: 'id', description: 'معرف المستخدم' })
  @ApiResponse({ status: 200, description: 'تم حذف المستخدم بنجاح' })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  @ApiResponse({ status: 403, description: 'لا يمكن حذف المالك أو حسابك الخاص' })
  async remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.usersService.remove(user.businessId, id, user.id);
  }

  @Post(':id/roles')
  @RequirePermissions('users:assign-roles')
  @ApiOperation({ summary: 'تعيين أدوار للمستخدم' })
  @ApiParam({ name: 'id', description: 'معرف المستخدم' })
  @ApiResponse({ status: 200, description: 'تم تعيين الأدوار بنجاح', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'المستخدم أو الأدوار غير موجودة' })
  async assignRoles(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
  ): Promise<UserResponseDto> {
    return this.usersService.assignRoles(businessId, id, dto);
  }
}
