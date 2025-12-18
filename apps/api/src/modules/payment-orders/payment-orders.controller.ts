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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentOrdersService } from './payment-orders.service';
import {
  CreatePaymentOrderDto,
  UpdatePaymentOrderDto,
  ExecutePaymentDto,
  CancelPaymentOrderDto,
  PaymentOrderQueryDto,
  PaymentOrderResponseDto,
  PaginatedPaymentOrdersDto,
  PaymentOrderStatisticsDto,
} from './dto';

@ApiTags('أوامر الدفع')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-orders')
export class PaymentOrdersController {
  constructor(private readonly paymentOrdersService: PaymentOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء أمر دفع جديد' })
  @ApiResponse({ status: 201, description: 'تم إنشاء أمر الدفع بنجاح', type: PaymentOrderResponseDto })
  async create(
    @Request() req: any,
    @Body() dto: CreatePaymentOrderDto,
  ): Promise<PaymentOrderResponseDto> {
    return this.paymentOrdersService.create(req.user.businessId, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'الحصول على قائمة أوامر الدفع' })
  @ApiResponse({ status: 200, description: 'قائمة أوامر الدفع', type: PaginatedPaymentOrdersDto })
  async findAll(
    @Request() req: any,
    @Query() query: PaymentOrderQueryDto,
  ): Promise<PaginatedPaymentOrdersDto> {
    return this.paymentOrdersService.findAll(req.user.businessId, query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'الحصول على إحصائيات أوامر الدفع' })
  @ApiResponse({ status: 200, description: 'إحصائيات أوامر الدفع', type: PaymentOrderStatisticsDto })
  async getStatistics(@Request() req: any): Promise<PaymentOrderStatisticsDto> {
    return this.paymentOrdersService.getStatistics(req.user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على تفاصيل أمر دفع' })
  @ApiResponse({ status: 200, description: 'تفاصيل أمر الدفع', type: PaymentOrderResponseDto })
  async findOne(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<PaymentOrderResponseDto> {
    return this.paymentOrdersService.findOne(req.user.businessId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث أمر دفع' })
  @ApiResponse({ status: 200, description: 'تم تحديث أمر الدفع بنجاح', type: PaymentOrderResponseDto })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentOrderDto,
  ): Promise<PaymentOrderResponseDto> {
    return this.paymentOrdersService.update(req.user.businessId, id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'تقديم أمر الدفع للاعتماد' })
  @ApiResponse({ status: 200, description: 'تم تقديم أمر الدفع للاعتماد', type: PaymentOrderResponseDto })
  async submitForApproval(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<PaymentOrderResponseDto> {
    return this.paymentOrdersService.submitForApproval(req.user.businessId, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'اعتماد أمر الدفع' })
  @ApiResponse({ status: 200, description: 'تم اعتماد أمر الدفع', type: PaymentOrderResponseDto })
  async approve(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<PaymentOrderResponseDto> {
    return this.paymentOrdersService.approve(req.user.businessId, id, req.user.id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'تنفيذ أمر الدفع' })
  @ApiResponse({ status: 200, description: 'تم تنفيذ أمر الدفع', type: PaymentOrderResponseDto })
  async execute(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ExecutePaymentDto,
  ): Promise<PaymentOrderResponseDto> {
    return this.paymentOrdersService.execute(req.user.businessId, id, req.user.id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'إلغاء أمر الدفع' })
  @ApiResponse({ status: 200, description: 'تم إلغاء أمر الدفع', type: PaymentOrderResponseDto })
  async cancel(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CancelPaymentOrderDto,
  ): Promise<PaymentOrderResponseDto> {
    return this.paymentOrdersService.cancel(req.user.businessId, id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف أمر دفع' })
  @ApiResponse({ status: 200, description: 'تم حذف أمر الدفع بنجاح' })
  async remove(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.paymentOrdersService.remove(req.user.businessId, id);
  }
}
