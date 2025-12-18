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
import { ServicesService } from './services.service';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateServicePriceDto,
  UpdateServicePriceDto,
  CreateServiceTierDto,
  UpdateServiceTierDto,
  CalculatePriceDto,
} from './dto';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ==================== فئات الخدمات ====================

  @Get('categories')
  async findAllCategories(@Request() req) {
    return this.servicesService.findAllCategories(req.user.businessId);
  }

  @Get('categories/tree')
  async getCategoriesTree(@Request() req) {
    return this.servicesService.getCategoriesTree(req.user.businessId);
  }

  @Get('categories/:id')
  async findCategoryById(@Request() req, @Param('id') id: string) {
    return this.servicesService.findCategoryById(req.user.businessId, id);
  }

  @Post('categories')
  async createCategory(@Request() req, @Body() dto: CreateServiceCategoryDto) {
    return this.servicesService.createCategory(req.user.businessId, dto);
  }

  @Put('categories/:id')
  async updateCategory(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    return this.servicesService.updateCategory(req.user.businessId, id, dto);
  }

  @Delete('categories/:id')
  async deleteCategory(@Request() req, @Param('id') id: string) {
    return this.servicesService.deleteCategory(req.user.businessId, id);
  }

  // ==================== الخدمات ====================

  @Get()
  async findAllServices(
    @Request() req,
    @Query('categoryId') categoryId?: string,
    @Query('serviceType') serviceType?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.servicesService.findAllServices(req.user.businessId, {
      categoryId,
      serviceType,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    return this.servicesService.getStatistics(req.user.businessId);
  }

  @Get(':id')
  async findServiceById(@Request() req, @Param('id') id: string) {
    return this.servicesService.findServiceById(req.user.businessId, id);
  }

  @Post()
  async createService(@Request() req, @Body() dto: CreateServiceDto) {
    return this.servicesService.createService(req.user.businessId, dto);
  }

  @Put(':id')
  async updateService(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.updateService(req.user.businessId, id, dto);
  }

  @Delete(':id')
  async deleteService(@Request() req, @Param('id') id: string) {
    return this.servicesService.deleteService(req.user.businessId, id);
  }

  // ==================== أسعار الخدمات ====================

  @Get(':serviceId/prices')
  async findServicePrices(@Request() req, @Param('serviceId') serviceId: string) {
    return this.servicesService.findServicePrices(req.user.businessId, serviceId);
  }

  @Post('prices')
  async createServicePrice(@Request() req, @Body() dto: CreateServicePriceDto) {
    return this.servicesService.createServicePrice(req.user.businessId, dto);
  }

  @Put('prices/:id')
  async updateServicePrice(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateServicePriceDto,
  ) {
    return this.servicesService.updateServicePrice(req.user.businessId, id, dto);
  }

  @Delete('prices/:id')
  async deleteServicePrice(@Request() req, @Param('id') id: string) {
    return this.servicesService.deleteServicePrice(req.user.businessId, id);
  }

  // ==================== شرائح التسعير ====================

  @Get(':serviceId/tiers')
  async findServiceTiers(@Request() req, @Param('serviceId') serviceId: string) {
    return this.servicesService.findServiceTiers(req.user.businessId, serviceId);
  }

  @Post('tiers')
  async createServiceTier(@Request() req, @Body() dto: CreateServiceTierDto) {
    return this.servicesService.createServiceTier(req.user.businessId, dto);
  }

  @Put('tiers/:id')
  async updateServiceTier(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateServiceTierDto,
  ) {
    return this.servicesService.updateServiceTier(req.user.businessId, id, dto);
  }

  @Delete('tiers/:id')
  async deleteServiceTier(@Request() req, @Param('id') id: string) {
    return this.servicesService.deleteServiceTier(req.user.businessId, id);
  }

  // ==================== حساب السعر ====================

  @Post('calculate-price')
  async calculatePrice(@Request() req, @Body() dto: CalculatePriceDto) {
    return this.servicesService.calculatePrice(req.user.businessId, dto);
  }

  // ==================== Seed ====================

  @Post('seed')
  async seedDefaultServices(@Request() req) {
    return this.servicesService.seedDefaultServices(req.user.businessId);
  }
}
