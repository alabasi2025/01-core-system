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
import { ClearingService } from './clearing.service';
import {
  CreateClearingAccountDto,
  UpdateClearingAccountDto,
  CreateClearingEntryDto,
  UpdateClearingEntryDto,
  ClearingEntryFilterDto,
  ReconcileBasketDto,
} from './dto';

@Controller('clearing')
@UseGuards(JwtAuthGuard)
export class ClearingController {
  constructor(private readonly clearingService: ClearingService) {}

  // ==================== Clearing Accounts ====================

  @Get('accounts')
  async findAllAccounts(@Request() req) {
    return this.clearingService.findAllAccounts(req.user.businessId);
  }

  @Get('accounts/:id')
  async findAccountById(@Param('id') id: string, @Request() req) {
    return this.clearingService.findAccountById(id, req.user.businessId);
  }

  @Post('accounts')
  async createAccount(@Body() dto: CreateClearingAccountDto, @Request() req) {
    return this.clearingService.createAccount(req.user.businessId, dto);
  }

  @Put('accounts/:id')
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateClearingAccountDto,
    @Request() req,
  ) {
    return this.clearingService.updateAccount(id, req.user.businessId, dto);
  }

  @Get('accounts/:id/balance')
  async getAccountBalance(@Param('id') id: string, @Request() req) {
    return this.clearingService.getAccountBalance(id, req.user.businessId);
  }

  // ==================== Clearing Entries ====================

  @Get('entries')
  async findAllEntries(@Query() filter: ClearingEntryFilterDto, @Request() req) {
    return this.clearingService.findAllEntries(req.user.businessId, filter);
  }

  @Get('entries/:id')
  async findEntryById(@Param('id') id: string, @Request() req) {
    return this.clearingService.findEntryById(id, req.user.businessId);
  }

  @Post('entries')
  async createEntry(@Body() dto: CreateClearingEntryDto, @Request() req) {
    return this.clearingService.createEntry(req.user.businessId, dto);
  }

  @Put('entries/:id')
  async updateEntry(
    @Param('id') id: string,
    @Body() dto: UpdateClearingEntryDto,
    @Request() req,
  ) {
    return this.clearingService.updateEntry(id, req.user.businessId, dto);
  }

  @Delete('entries/:id')
  async deleteEntry(@Param('id') id: string, @Request() req) {
    return this.clearingService.deleteEntry(id, req.user.businessId);
  }

  // ==================== Reconciliation Basket ====================

  @Get('unreconciled')
  async getUnreconciledEntries(
    @Query('accountIds') accountIds: string,
    @Request() req,
  ) {
    const ids = accountIds ? accountIds.split(',') : undefined;
    return this.clearingService.getUnreconciledEntries(req.user.businessId, ids);
  }

  @Post('reconcile')
  async reconcileBasket(@Body() dto: ReconcileBasketDto, @Request() req) {
    return this.clearingService.reconcileBasket(
      req.user.businessId,
      req.user.sub,
      dto,
    );
  }

  // ==================== Seed ====================

  @Post('seed')
  async seedClearingAccounts(@Request() req) {
    return this.clearingService.seedClearingAccounts(req.user.businessId);
  }

  // ==================== Statistics ====================

  @Get('statistics')
  async getStatistics(@Request() req) {
    return this.clearingService.getStatistics(req.user.businessId);
  }
}
