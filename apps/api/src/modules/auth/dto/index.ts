import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'البريد الإلكتروني', example: 'admin@electricity.com' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @ApiProperty({ description: 'كلمة المرور', example: 'password123' })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً' })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'اسم المجموعة/الشركة', example: 'شركة الكهرباء' })
  @IsString()
  @IsNotEmpty({ message: 'اسم المجموعة مطلوب' })
  businessName: string;

  @ApiPropertyOptional({ description: 'اسم المجموعة بالإنجليزية', example: 'Electricity Company' })
  @IsString()
  @IsOptional()
  businessNameEn?: string;

  @ApiProperty({ description: 'اسم المستخدم', example: 'أحمد محمد' })
  @IsString()
  @IsNotEmpty({ message: 'اسم المستخدم مطلوب' })
  name: string;

  @ApiProperty({ description: 'البريد الإلكتروني', example: 'admin@electricity.com' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف', example: '+967777123456' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'كلمة المرور', example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh Token مطلوب' })
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'كلمة المرور الحالية' })
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور الحالية مطلوبة' })
  currentPassword: string;

  @ApiProperty({ description: 'كلمة المرور الجديدة' })
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  newPassword: string;
}

export class TokenResponseDto {
  @ApiProperty({ description: 'Access Token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh Token' })
  refreshToken: string;

  @ApiProperty({ description: 'نوع التوكن' })
  tokenType: string;

  @ApiProperty({ description: 'مدة صلاحية التوكن بالثواني' })
  expiresIn: number;
}

export class UserResponseDto {
  @ApiProperty({ description: 'معرف المستخدم' })
  id: string;

  @ApiProperty({ description: 'اسم المستخدم' })
  name: string;

  @ApiProperty({ description: 'البريد الإلكتروني' })
  email: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف' })
  phone?: string;

  @ApiProperty({ description: 'معرف المجموعة' })
  businessId: string;

  @ApiProperty({ description: 'هل هو المالك' })
  isOwner: boolean;

  @ApiProperty({ description: 'نطاق الصلاحية' })
  scopeType: string;

  @ApiProperty({ description: 'الأدوار' })
  roles: string[];

  @ApiProperty({ description: 'الصلاحيات' })
  permissions: string[];
}

export class AuthResponseDto {
  @ApiProperty({ description: 'بيانات المستخدم' })
  user: UserResponseDto;

  @ApiProperty({ description: 'بيانات التوكن' })
  tokens: TokenResponseDto;
}
