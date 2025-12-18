import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('النظام')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'فحص حالة النظام' })
  healthCheck() {
    return this.appService.healthCheck();
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'معلومات النظام' })
  getInfo() {
    return this.appService.getInfo();
  }
}
