import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, AccountQueryDto, AccountResponseDto, AccountTreeDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('شجرة الحسابات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @RequirePermissions('accounts:create')
  @ApiOperation({ summary: 'إنشاء حساب جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الحساب بنجاح', type: AccountResponseDto })
  @ApiResponse({ status: 409, description: 'كود الحساب مستخدم بالفعل' })
  async create(
    @CurrentUser('businessId') businessId: string,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountsService.create(businessId, dto);
  }

  @Get()
  @RequirePermissions('accounts:read')
  @ApiOperation({ summary: 'الحصول على قائمة الحسابات' })
  @ApiResponse({ status: 200, description: 'قائمة الحسابات', type: [AccountResponseDto] })
  async findAll(
    @CurrentUser('businessId') businessId: string,
    @Query() query: AccountQueryDto,
  ): Promise<AccountResponseDto[]> {
    return this.accountsService.findAll(businessId, query);
  }

  @Get('tree')
  @RequirePermissions('accounts:read')
  @ApiOperation({ summary: 'الحصول على شجرة الحسابات' })
  @ApiResponse({ status: 200, description: 'شجرة الحسابات', type: AccountTreeDto })
  async getTree(@CurrentUser('businessId') businessId: string): Promise<AccountTreeDto> {
    return this.accountsService.getTree(businessId);
  }

  @Post('seed')
  @RequirePermissions('accounts:create')
  @ApiOperation({ summary: 'إنشاء شجرة الحسابات الافتراضية' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الحسابات الافتراضية' })
  async seedDefaultAccounts(@CurrentUser('businessId') businessId: string): Promise<{ created: number }> {
    return this.accountsService.seedDefaultAccounts(businessId);
  }

  @Get(':id')
  @RequirePermissions('accounts:read')
  @ApiOperation({ summary: 'الحصول على بيانات حساب' })
  @ApiParam({ name: 'id', description: 'معرف الحساب' })
  @ApiResponse({ status: 200, description: 'بيانات الحساب', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'الحساب غير موجود' })
  async findOne(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.findOne(businessId, id);
  }

  @Put(':id')
  @RequirePermissions('accounts:update')
  @ApiOperation({ summary: 'تحديث بيانات حساب' })
  @ApiParam({ name: 'id', description: 'معرف الحساب' })
  @ApiResponse({ status: 200, description: 'تم تحديث الحساب بنجاح', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'الحساب غير موجود' })
  async update(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountsService.update(businessId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('accounts:delete')
  @ApiOperation({ summary: 'حذف حساب' })
  @ApiParam({ name: 'id', description: 'معرف الحساب' })
  @ApiResponse({ status: 200, description: 'تم حذف الحساب بنجاح' })
  @ApiResponse({ status: 404, description: 'الحساب غير موجود' })
  @ApiResponse({ status: 409, description: 'لا يمكن حذف الحساب لارتباطه ببيانات أخرى' })
  async remove(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.accountsService.remove(businessId, id);
  }
}
