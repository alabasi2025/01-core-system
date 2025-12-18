import { Module } from '@nestjs/common';
import { ClearingController } from './clearing.controller';
import { ClearingService } from './clearing.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClearingController],
  providers: [ClearingService],
  exports: [ClearingService],
})
export class ClearingModule {}
