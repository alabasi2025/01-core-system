import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, IsArray, ValidateNested, IsDateString, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum PayeeType {
  SUPPLIER = 'supplier',
  EMPLOYEE = 'employee',
  CONTRACTOR = 'contractor',
  GOVERNMENT = 'government',
  OTHER = 'other',
}

export enum PaymentOrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum PaymentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer',
  POS = 'pos',
  MOBILE = 'mobile',
  CREDIT_CARD = 'credit_card',
}

// Create Payment Order Item DTO
export class CreatePaymentOrderItemDto {
  @ApiProperty({ description: 'معرف الحساب' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ description: 'الوصف' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'الكمية', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({ description: 'سعر الوحدة' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'مبلغ الضريبة', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'معرف مركز التكلفة' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'معرف المشروع' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Create Payment Order DTO
export class CreatePaymentOrderDto {
  @ApiProperty({ description: 'تاريخ الأمر' })
  @IsDateString()
  orderDate: string;

  @ApiPropertyOptional({ description: 'تاريخ الاستحقاق' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ description: 'نوع المستفيد', enum: PayeeType })
  @IsEnum(PayeeType)
  payeeType: PayeeType;

  @ApiPropertyOptional({ description: 'معرف المستفيد' })
  @IsOptional()
  @IsUUID()
  payeeId?: string;

  @ApiProperty({ description: 'اسم المستفيد' })
  @IsString()
  payeeName: string;

  @ApiPropertyOptional({ description: 'رقم حساب المستفيد' })
  @IsOptional()
  @IsString()
  payeeAccount?: string;

  @ApiPropertyOptional({ description: 'اسم البنك' })
  @IsOptional()
  @IsString()
  payeeBankName?: string;

  @ApiPropertyOptional({ description: 'طريقة الدفع', enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'العملة', default: 'YER' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'الأولوية', enum: PaymentPriority, default: PaymentPriority.NORMAL })
  @IsOptional()
  @IsEnum(PaymentPriority)
  priority?: PaymentPriority;

  @ApiPropertyOptional({ description: 'الوصف' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'نوع المصدر' })
  @IsOptional()
  @IsString()
  sourceType?: string;

  @ApiPropertyOptional({ description: 'معرف المصدر' })
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiProperty({ description: 'بنود أمر الدفع', type: [CreatePaymentOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentOrderItemDto)
  items: CreatePaymentOrderItemDto[];
}

// Update Payment Order DTO
export class UpdatePaymentOrderDto {
  @ApiPropertyOptional({ description: 'تاريخ الأمر' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ description: 'تاريخ الاستحقاق' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'نوع المستفيد', enum: PayeeType })
  @IsOptional()
  @IsEnum(PayeeType)
  payeeType?: PayeeType;

  @ApiPropertyOptional({ description: 'معرف المستفيد' })
  @IsOptional()
  @IsUUID()
  payeeId?: string;

  @ApiPropertyOptional({ description: 'اسم المستفيد' })
  @IsOptional()
  @IsString()
  payeeName?: string;

  @ApiPropertyOptional({ description: 'رقم حساب المستفيد' })
  @IsOptional()
  @IsString()
  payeeAccount?: string;

  @ApiPropertyOptional({ description: 'اسم البنك' })
  @IsOptional()
  @IsString()
  payeeBankName?: string;

  @ApiPropertyOptional({ description: 'طريقة الدفع', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'الأولوية', enum: PaymentPriority })
  @IsOptional()
  @IsEnum(PaymentPriority)
  priority?: PaymentPriority;

  @ApiPropertyOptional({ description: 'الوصف' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'بنود أمر الدفع', type: [CreatePaymentOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentOrderItemDto)
  items?: CreatePaymentOrderItemDto[];
}

// Execute Payment DTO
export class ExecutePaymentDto {
  @ApiProperty({ description: 'تاريخ التنفيذ' })
  @IsDateString()
  executionDate: string;

  @ApiProperty({ description: 'المبلغ' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'طريقة الدفع', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'رقم المرجع' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'معرف الحساب البنكي' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'معرف صندوق النقد' })
  @IsOptional()
  @IsUUID()
  cashBoxId?: string;

  @ApiPropertyOptional({ description: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Cancel Payment Order DTO
export class CancelPaymentOrderDto {
  @ApiProperty({ description: 'سبب الإلغاء' })
  @IsString()
  reason: string;
}

// Query DTO
export class PaymentOrderQueryDto {
  @ApiPropertyOptional({ description: 'البحث' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'الحالة', enum: PaymentOrderStatus })
  @IsOptional()
  @IsEnum(PaymentOrderStatus)
  status?: PaymentOrderStatus;

  @ApiPropertyOptional({ description: 'نوع المستفيد', enum: PayeeType })
  @IsOptional()
  @IsEnum(PayeeType)
  payeeType?: PayeeType;

  @ApiPropertyOptional({ description: 'الأولوية', enum: PaymentPriority })
  @IsOptional()
  @IsEnum(PaymentPriority)
  priority?: PaymentPriority;

  @ApiPropertyOptional({ description: 'معرف المحطة' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'من تاريخ' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'إلى تاريخ' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'عدد العناصر', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

// Response DTOs
export class PaymentOrderItemResponseDto {
  id: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  costCenterId?: string;
  projectId?: string;
  notes?: string;
}

export class PaymentOrderResponseDto {
  id: string;
  businessId: string;
  orderNumber: string;
  orderDate: Date;
  dueDate?: Date;
  payeeType: PayeeType;
  payeeId?: string;
  payeeName: string;
  payeeAccount?: string;
  payeeBankName?: string;
  paymentMethod: PaymentMethod;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentOrderStatus;
  priority: PaymentPriority;
  description?: string;
  notes?: string;
  stationId?: string;
  stationName?: string;
  sourceType?: string;
  sourceId?: string;
  journalEntryId?: string;
  createdById: string;
  createdByName?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: Date;
  executedById?: string;
  executedByName?: string;
  executedAt?: Date;
  cancelledById?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: PaymentOrderItemResponseDto[];
}

export class PaginatedPaymentOrdersDto {
  data: PaymentOrderResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PaymentOrderStatisticsDto {
  totalOrders: number;
  draftOrders: number;
  pendingApprovalOrders: number;
  approvedOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueOrders: number;
  overdueAmount: number;
}
