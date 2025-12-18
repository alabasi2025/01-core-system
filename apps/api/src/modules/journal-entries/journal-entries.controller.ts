import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntryDto, UpdateJournalEntryDto, JournalEntryQueryDto, JournalEntryResponseDto, PaginatedJournalEntriesDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('القيود اليومية')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Post()
  @RequirePermissions('journal-entries:create')
  @ApiOperation({ summary: 'إنشاء قيد يومي جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء القيد بنجاح', type: JournalEntryResponseDto })
  @ApiResponse({ status: 400, description: 'القيد غير متوازن أو بيانات غير صحيحة' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateJournalEntryDto,
  ): Promise<JournalEntryResponseDto> {
    return this.journalEntriesService.create(user.businessId, user.id, dto);
  }

  @Get()
  @RequirePermissions('journal-entries:read')
  @ApiOperation({ summary: 'الحصول على قائمة القيود' })
  @ApiResponse({ status: 200, description: 'قائمة القيود', type: PaginatedJournalEntriesDto })
  async findAll(
    @CurrentUser('businessId') businessId: string,
    @Query() query: JournalEntryQueryDto,
  ): Promise<PaginatedJournalEntriesDto> {
    return this.journalEntriesService.findAll(businessId, query);
  }

  @Get(':id')
  @RequirePermissions('journal-entries:read')
  @ApiOperation({ summary: 'الحصول على بيانات قيد' })
  @ApiParam({ name: 'id', description: 'معرف القيد' })
  @ApiResponse({ status: 200, description: 'بيانات القيد', type: JournalEntryResponseDto })
  @ApiResponse({ status: 404, description: 'القيد غير موجود' })
  async findOne(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
  ): Promise<JournalEntryResponseDto> {
    return this.journalEntriesService.findOne(businessId, id);
  }

  @Put(':id')
  @RequirePermissions('journal-entries:update')
  @ApiOperation({ summary: 'تحديث بيانات قيد (مسودة فقط)' })
  @ApiParam({ name: 'id', description: 'معرف القيد' })
  @ApiResponse({ status: 200, description: 'تم تحديث القيد بنجاح', type: JournalEntryResponseDto })
  @ApiResponse({ status: 404, description: 'القيد غير موجود' })
  @ApiResponse({ status: 403, description: 'لا يمكن تعديل القيد بعد الترحيل' })
  async update(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJournalEntryDto,
  ): Promise<JournalEntryResponseDto> {
    return this.journalEntriesService.update(businessId, id, dto);
  }

  @Post(':id/post')
  @RequirePermissions('journal-entries:post')
  @ApiOperation({ summary: 'ترحيل قيد' })
  @ApiParam({ name: 'id', description: 'معرف القيد' })
  @ApiResponse({ status: 200, description: 'تم ترحيل القيد بنجاح', type: JournalEntryResponseDto })
  @ApiResponse({ status: 404, description: 'القيد غير موجود' })
  @ApiResponse({ status: 403, description: 'القيد مرحّل بالفعل' })
  async post(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<JournalEntryResponseDto> {
    return this.journalEntriesService.post(user.businessId, id, user.id);
  }

  @Post(':id/void')
  @RequirePermissions('journal-entries:void')
  @ApiOperation({ summary: 'إلغاء قيد' })
  @ApiParam({ name: 'id', description: 'معرف القيد' })
  @ApiResponse({ status: 200, description: 'تم إلغاء القيد بنجاح', type: JournalEntryResponseDto })
  @ApiResponse({ status: 404, description: 'القيد غير موجود' })
  @ApiResponse({ status: 403, description: 'القيد ملغي بالفعل' })
  async void(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<JournalEntryResponseDto> {
    return this.journalEntriesService.void(user.businessId, id, user.id);
  }

  @Delete(':id')
  @RequirePermissions('journal-entries:delete')
  @ApiOperation({ summary: 'حذف قيد (مسودة فقط)' })
  @ApiParam({ name: 'id', description: 'معرف القيد' })
  @ApiResponse({ status: 200, description: 'تم حذف القيد بنجاح' })
  @ApiResponse({ status: 404, description: 'القيد غير موجود' })
  @ApiResponse({ status: 403, description: 'لا يمكن حذف القيد بعد الترحيل' })
  async remove(
    @CurrentUser('businessId') businessId: string,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.journalEntriesService.remove(businessId, id);
  }
}
