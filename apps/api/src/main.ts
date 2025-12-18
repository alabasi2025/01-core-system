/**
 * Core System API - النظام الأم
 * Electricity Management System
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Use Pino Logger
  app.useLogger(app.get(PinoLogger));
  
  // Global prefix
  const globalPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  
  // CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('النظام الأم - Core System API')
    .setDescription('واجهة برمجة التطبيقات للنظام الأم - نظام إدارة الكهرباء')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('المصادقة', 'تسجيل الدخول والخروج وإدارة التوكنات')
    .addTag('المستخدمين', 'إدارة المستخدمين')
    .addTag('الأدوار', 'إدارة الأدوار والصلاحيات')
    .addTag('المجموعات', 'إدارة المجموعات/الشركات')
    .addTag('المحطات', 'إدارة المحطات')
    .addTag('الحسابات', 'شجرة الحسابات')
    .addTag('القيود', 'القيود اليومية')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  
  // Start server
  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  
  Logger.log(
    `🚀 النظام الأم يعمل على: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📚 Swagger متاح على: http://localhost:${port}/docs`,
  );
}

bootstrap();
