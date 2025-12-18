import { IsString, IsOptional, IsUUID, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiPropertyOptional({ description: 'معرف المجموعة' })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiProperty({ description: 'مفتاح الإعداد' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'قيمة الإعداد' })
  @IsObject()
  value: any;

  @ApiProperty({ description: 'تصنيف الإعداد' })
  @IsString()
  @IsNotEmpty()
  category: string;
}

export class UpdateSettingDto {
  @ApiProperty({ description: 'قيمة الإعداد' })
  @IsObject()
  value: any;
}

export class BulkUpdateSettingsDto {
  @ApiProperty({ description: 'قائمة الإعدادات', type: [CreateSettingDto] })
  settings: CreateSettingDto[];
}

// الإعدادات الافتراضية للنظام
export const DEFAULT_SETTINGS = {
  // إعدادات عامة
  general: {
    'system.language': { value: 'ar', description: 'لغة النظام' },
    'system.timezone': { value: 'Asia/Aden', description: 'المنطقة الزمنية' },
    'system.currency': { value: 'YER', description: 'العملة الافتراضية' },
    'system.date_format': { value: 'DD/MM/YYYY', description: 'تنسيق التاريخ' },
  },
  // إعدادات المحاسبة
  accounting: {
    'accounting.fiscal_year_start': { value: '01-01', description: 'بداية السنة المالية' },
    'accounting.auto_post_entries': { value: false, description: 'ترحيل القيود تلقائياً' },
    'accounting.require_approval': { value: true, description: 'طلب موافقة على القيود' },
    'accounting.decimal_places': { value: 2, description: 'عدد الخانات العشرية' },
  },
  // إعدادات الفوترة
  billing: {
    'billing.invoice_prefix': { value: 'INV', description: 'بادئة رقم الفاتورة' },
    'billing.payment_terms_days': { value: 30, description: 'مدة السداد بالأيام' },
    'billing.late_fee_percentage': { value: 0, description: 'نسبة غرامة التأخير' },
  },
  // إعدادات الأمان
  security: {
    'security.password_min_length': { value: 8, description: 'الحد الأدنى لطول كلمة المرور' },
    'security.session_timeout_minutes': { value: 30, description: 'مدة انتهاء الجلسة بالدقائق' },
    'security.max_login_attempts': { value: 5, description: 'الحد الأقصى لمحاولات تسجيل الدخول' },
  },
};
