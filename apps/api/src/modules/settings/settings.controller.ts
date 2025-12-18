import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto, BulkUpdateSettingsDto } from './dto';

@ApiTags('الإعدادات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على جميع الإعدادات' })
  @ApiQuery({ name: 'category', required: false, description: 'تصنيف الإعدادات' })
  async findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
  ) {
    return this.settingsService.findAll(user.businessId, category);
  }

  @Get('defaults')
  @ApiOperation({ summary: 'الحصول على الإعدادات الافتراضية' })
  getDefaults() {
    return this.settingsService.getDefaultSettings();
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'الحصول على إعداد معين' })
  async findOne(
    @CurrentUser() user: any,
    @Param('key') key: string,
  ) {
    return this.settingsService.findOne(user.businessId, key);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء أو تحديث إعداد' })
  async upsert(
    @CurrentUser() user: any,
    @Body() dto: CreateSettingDto,
  ) {
    return this.settingsService.upsert(user.businessId, dto);
  }

  @Put('key/:key')
  @ApiOperation({ summary: 'تحديث إعداد معين' })
  async update(
    @CurrentUser() user: any,
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ) {
    return this.settingsService.update(user.businessId, key, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'تحديث مجموعة إعدادات' })
  async bulkUpdate(
    @CurrentUser() user: any,
    @Body() dto: BulkUpdateSettingsDto,
  ) {
    return this.settingsService.bulkUpdate(user.businessId, dto.settings);
  }

  @Delete('key/:key')
  @ApiOperation({ summary: 'حذف إعداد' })
  async remove(
    @CurrentUser() user: any,
    @Param('key') key: string,
  ) {
    return this.settingsService.remove(user.businessId, key);
  }

  @Post('reset')
  @ApiOperation({ summary: 'إعادة تعيين الإعدادات للقيم الافتراضية' })
  @ApiQuery({ name: 'category', required: false, description: 'تصنيف معين للإعادة' })
  async resetToDefaults(
    @CurrentUser() user: any,
    @Query('category') category?: string,
  ) {
    return this.settingsService.resetToDefaults(user.businessId, category);
  }

  // إعدادات المحطات
  @Get('station/:stationId')
  @ApiOperation({ summary: 'الحصول على إعدادات محطة' })
  async getStationSettings(
    @CurrentUser() user: any,
    @Param('stationId') stationId: string,
  ) {
    return this.settingsService.getStationSettings(user.businessId, stationId);
  }

  @Put('station/:stationId')
  @ApiOperation({ summary: 'تحديث إعدادات محطة' })
  async updateStationSettings(
    @CurrentUser() user: any,
    @Param('stationId') stationId: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.settingsService.updateStationSettings(user.businessId, stationId, settings);
  }
}
