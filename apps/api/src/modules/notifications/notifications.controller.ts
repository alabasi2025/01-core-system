import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('الإشعارات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * جلب إشعارات المستخدم
   */
  @Get()
  @ApiOperation({ summary: 'جلب إشعارات المستخدم' })
  @ApiQuery({ name: 'type', required: false, enum: ['info', 'warning', 'success', 'error'] })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'قائمة الإشعارات' })
  async findAll(
    @Request() req,
    @Query('type') type?: string,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(req.user.id, {
      type,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * جلب عدد الإشعارات غير المقروءة
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'جلب عدد الإشعارات غير المقروءة' })
  @ApiResponse({ status: 200, description: 'عدد الإشعارات غير المقروءة' })
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  /**
   * جلب إشعار واحد
   */
  @Get(':id')
  @ApiOperation({ summary: 'جلب إشعار واحد' })
  @ApiResponse({ status: 200, description: 'تفاصيل الإشعار' })
  @ApiResponse({ status: 404, description: 'الإشعار غير موجود' })
  async findById(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.findById(id, req.user.id);
  }

  /**
   * تحديد إشعار كمقروء
   */
  @Post(':id/read')
  @ApiOperation({ summary: 'تحديد إشعار كمقروء' })
  @ApiResponse({ status: 200, description: 'تم تحديد الإشعار كمقروء' })
  @ApiResponse({ status: 404, description: 'الإشعار غير موجود' })
  async markAsRead(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  /**
   * تحديد جميع الإشعارات كمقروءة
   */
  @Post('read-all')
  @ApiOperation({ summary: 'تحديد جميع الإشعارات كمقروءة' })
  @ApiResponse({ status: 200, description: 'تم تحديد جميع الإشعارات كمقروءة' })
  async markAllAsRead(@Request() req) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'تم تحديد جميع الإشعارات كمقروءة', count: result.count };
  }

  /**
   * حذف إشعار
   */
  @Delete(':id')
  @ApiOperation({ summary: 'حذف إشعار' })
  @ApiResponse({ status: 200, description: 'تم حذف الإشعار' })
  @ApiResponse({ status: 404, description: 'الإشعار غير موجود' })
  async delete(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationsService.delete(id, req.user.id);
    return { message: 'تم حذف الإشعار بنجاح' };
  }

  /**
   * حذف الإشعارات القديمة
   */
  @Delete('cleanup/old')
  @ApiOperation({ summary: 'حذف الإشعارات القديمة المقروءة' })
  @ApiQuery({ name: 'daysOld', required: false, type: Number, description: 'عدد الأيام (افتراضي: 30)' })
  @ApiResponse({ status: 200, description: 'تم حذف الإشعارات القديمة' })
  async deleteOldNotifications(
    @Request() req,
    @Query('daysOld') daysOld?: string,
  ) {
    const result = await this.notificationsService.deleteOldNotifications(
      req.user.id,
      daysOld ? parseInt(daysOld, 10) : 30,
    );
    return { message: 'تم حذف الإشعارات القديمة', count: result.count };
  }
}
