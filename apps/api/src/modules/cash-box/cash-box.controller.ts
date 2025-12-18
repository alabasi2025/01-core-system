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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CashBoxService } from './cash-box.service';
import {
  CreateCashBoxDto,
  UpdateCashBoxDto,
  CreateCollectorDto,
  UpdateCollectorDto,
  OpenCashBoxSessionDto,
  CloseCashBoxSessionDto,
  OpenCollectorSessionDto,
  CloseCollectorSessionDto,
  CreateCashBoxTransactionDto,
  CreateCollectionDto,
  DepositCollectionsDto,
} from './dto';

@Controller('cash-box')
@UseGuards(JwtAuthGuard)
export class CashBoxController {
  constructor(private readonly cashBoxService: CashBoxService) {}

  // ==================== Cash Boxes ====================

  @Get('boxes')
  async findAllCashBoxes(@Request() req: any) {
    return this.cashBoxService.findAllCashBoxes(req.user.businessId);
  }

  @Get('boxes/:id')
  async findCashBoxById(@Param('id') id: string, @Request() req: any) {
    return this.cashBoxService.findCashBoxById(id, req.user.businessId);
  }

  @Post('boxes')
  async createCashBox(@Body() dto: CreateCashBoxDto, @Request() req: any) {
    return this.cashBoxService.createCashBox(req.user.businessId, dto);
  }

  @Put('boxes/:id')
  async updateCashBox(
    @Param('id') id: string,
    @Body() dto: UpdateCashBoxDto,
    @Request() req: any,
  ) {
    return this.cashBoxService.updateCashBox(id, req.user.businessId, dto);
  }

  @Delete('boxes/:id')
  async deleteCashBox(@Param('id') id: string, @Request() req: any) {
    return this.cashBoxService.deleteCashBox(id, req.user.businessId);
  }

  // ==================== Collectors ====================

  @Get('collectors')
  async findAllCollectors(@Request() req: any) {
    return this.cashBoxService.findAllCollectors(req.user.businessId);
  }

  @Get('collectors/:id')
  async findCollectorById(@Param('id') id: string, @Request() req: any) {
    return this.cashBoxService.findCollectorById(id, req.user.businessId);
  }

  @Post('collectors')
  async createCollector(@Body() dto: CreateCollectorDto, @Request() req: any) {
    return this.cashBoxService.createCollector(req.user.businessId, dto);
  }

  @Put('collectors/:id')
  async updateCollector(
    @Param('id') id: string,
    @Body() dto: UpdateCollectorDto,
    @Request() req: any,
  ) {
    return this.cashBoxService.updateCollector(id, req.user.businessId, dto);
  }

  // ==================== Cash Box Sessions ====================

  @Post('sessions/open')
  async openCashBoxSession(@Body() dto: OpenCashBoxSessionDto, @Request() req: any) {
    return this.cashBoxService.openCashBoxSession(req.user.businessId, req.user.id, dto);
  }

  @Post('sessions/:id/close')
  async closeCashBoxSession(
    @Param('id') id: string,
    @Body() dto: CloseCashBoxSessionDto,
    @Request() req: any,
  ) {
    return this.cashBoxService.closeCashBoxSession(id, req.user.id, dto);
  }

  // ==================== Collector Sessions ====================

  @Post('collector-sessions/open')
  async openCollectorSession(@Body() dto: OpenCollectorSessionDto, @Request() req: any) {
    return this.cashBoxService.openCollectorSession(req.user.businessId, dto);
  }

  @Post('collector-sessions/:id/close')
  async closeCollectorSession(
    @Param('id') id: string,
    @Body() dto: CloseCollectorSessionDto,
  ) {
    return this.cashBoxService.closeCollectorSession(id, dto);
  }

  // ==================== Transactions ====================

  @Post('transactions')
  async createTransaction(@Body() dto: CreateCashBoxTransactionDto, @Request() req: any) {
    return this.cashBoxService.createTransaction(req.user.businessId, req.user.id, dto);
  }

  @Get('boxes/:id/transactions')
  async findTransactions(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    return this.cashBoxService.findTransactions(
      id,
      req.user.businessId,
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  // ==================== Collections ====================

  @Post('collections')
  async createCollection(@Body() dto: CreateCollectionDto, @Request() req: any) {
    return this.cashBoxService.createCollection(req.user.businessId, req.user.id, dto);
  }

  @Get('collections')
  async findCollections(
    @Query('collectorId') collectorId: string,
    @Query('status') status: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    return this.cashBoxService.findCollections(
      req.user.businessId,
      { collectorId, status, dateFrom, dateTo },
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Post('collections/deposit')
  async depositCollections(@Body() dto: DepositCollectionsDto, @Request() req: any) {
    return this.cashBoxService.depositCollections(req.user.businessId, req.user.id, dto);
  }

  // ==================== Statistics ====================

  @Get('statistics')
  async getStatistics(@Request() req: any) {
    return this.cashBoxService.getStatistics(req.user.businessId);
  }
}
