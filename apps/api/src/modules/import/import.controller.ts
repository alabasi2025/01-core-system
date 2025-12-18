import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ImportService } from './import.service';

@ApiTags('استيراد البيانات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('accounts')
  @ApiOperation({ summary: 'استيراد الحسابات من ملف Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'نتيجة الاستيراد' })
  @UseInterceptors(FileInterceptor('file'))
  async importAccounts(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { success: false, message: 'يرجى رفع ملف' };
    }

    return this.importService.importAccounts(
      req.user.businessId,
      req.user.id,
      file.buffer,
    );
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'استيراد القيود اليومية من ملف Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'نتيجة الاستيراد' })
  @UseInterceptors(FileInterceptor('file'))
  async importJournalEntries(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { success: false, message: 'يرجى رفع ملف' };
    }

    return this.importService.importJournalEntries(
      req.user.businessId,
      req.user.id,
      file.buffer,
    );
  }

  @Post('opening-balances')
  @ApiOperation({ summary: 'استيراد الأرصدة الافتتاحية من ملف Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'نتيجة الاستيراد' })
  @UseInterceptors(FileInterceptor('file'))
  async importOpeningBalances(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('periodDate') periodDate: string,
  ) {
    if (!file) {
      return { success: false, message: 'يرجى رفع ملف' };
    }

    const date = periodDate ? new Date(periodDate) : new Date();

    return this.importService.importOpeningBalances(
      req.user.businessId,
      req.user.id,
      file.buffer,
      date,
    );
  }

  @Post('preview')
  @ApiOperation({ summary: 'معاينة ملف قبل الاستيراد' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'معاينة البيانات' })
  @UseInterceptors(FileInterceptor('file'))
  async previewFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: false, message: 'يرجى رفع ملف' };
    }

    return this.importService.previewFile(file.buffer);
  }

  @Get('templates/accounts')
  @ApiOperation({ summary: 'تحميل قالب استيراد الحسابات' })
  @ApiResponse({ status: 200, description: 'ملف Excel' })
  async downloadAccountsTemplate(@Res() res: Response) {
    const buffer = this.importService.getAccountsTemplate();
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=accounts_template.xlsx',
    );
    res.send(buffer);
  }

  @Get('templates/journal-entries')
  @ApiOperation({ summary: 'تحميل قالب استيراد القيود' })
  @ApiResponse({ status: 200, description: 'ملف Excel' })
  async downloadJournalEntriesTemplate(@Res() res: Response) {
    const buffer = this.importService.getJournalEntriesTemplate();
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=journal_entries_template.xlsx',
    );
    res.send(buffer);
  }

  @Get('templates/opening-balances')
  @ApiOperation({ summary: 'تحميل قالب استيراد الأرصدة الافتتاحية' })
  @ApiResponse({ status: 200, description: 'ملف Excel' })
  async downloadOpeningBalancesTemplate(@Res() res: Response) {
    const buffer = this.importService.getOpeningBalancesTemplate();
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=opening_balances_template.xlsx',
    );
    res.send(buffer);
  }
}
