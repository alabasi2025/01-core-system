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
import { ReconciliationService } from './reconciliation.service';
import {
  CreateReconciliationDto,
  UpdateReconciliationDto,
  ReconciliationFilterDto,
  CreateReconciliationRuleDto,
  UpdateReconciliationRuleDto,
  CreateMatchDto,
  AutoMatchDto,
  CreateAllocationDto,
  ResolveExceptionDto,
} from './dto';

@Controller('reconciliation')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  // ==================== Reconciliations ====================

  @Get()
  async findAll(@Query() filter: ReconciliationFilterDto, @Request() req) {
    return this.reconciliationService.findAll(req.user.businessId, filter);
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    return this.reconciliationService.getStatistics(req.user.businessId);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Request() req) {
    return this.reconciliationService.findById(id, req.user.businessId);
  }

  @Post()
  async create(@Body() dto: CreateReconciliationDto, @Request() req) {
    return this.reconciliationService.create(
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReconciliationDto,
    @Request() req,
  ) {
    return this.reconciliationService.update(
      id,
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  @Post(':id/finalize')
  async finalize(@Param('id') id: string, @Request() req) {
    return this.reconciliationService.finalize(
      id,
      req.user.businessId,
      req.user.id,
    );
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Request() req) {
    return this.reconciliationService.cancel(
      id,
      req.user.businessId,
      req.user.id,
    );
  }

  // ==================== Reconciliation Rules ====================

  @Get('rules/list')
  async findAllRules(@Request() req) {
    return this.reconciliationService.findAllRules(req.user.businessId);
  }

  @Post('rules')
  async createRule(@Body() dto: CreateReconciliationRuleDto, @Request() req) {
    return this.reconciliationService.createRule(req.user.businessId, dto);
  }

  @Put('rules/:id')
  async updateRule(
    @Param('id') id: string,
    @Body() dto: UpdateReconciliationRuleDto,
    @Request() req,
  ) {
    return this.reconciliationService.updateRule(id, req.user.businessId, dto);
  }

  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string, @Request() req) {
    return this.reconciliationService.deleteRule(id, req.user.businessId);
  }

  // ==================== Matching ====================

  @Post('match')
  async createMatch(@Body() dto: CreateMatchDto, @Request() req) {
    return this.reconciliationService.createMatch(
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  @Post('auto-match')
  async autoMatch(@Body() dto: AutoMatchDto, @Request() req) {
    return this.reconciliationService.autoMatch(
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  // ==================== Allocations ====================

  @Post('allocate')
  async createAllocation(@Body() dto: CreateAllocationDto, @Request() req) {
    return this.reconciliationService.createAllocation(
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  // ==================== Exceptions ====================

  @Get(':id/exceptions')
  async findExceptions(@Param('id') id: string, @Request() req) {
    return this.reconciliationService.findExceptions(id, req.user.businessId);
  }

  @Post('exceptions/:id/resolve')
  async resolveException(
    @Param('id') id: string,
    @Body() dto: ResolveExceptionDto,
    @Request() req,
  ) {
    return this.reconciliationService.resolveException(
      id,
      req.user.businessId,
      req.user.id,
      dto,
    );
  }
}
