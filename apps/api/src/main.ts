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
    .setDescription(`
واجهة برمجة التطبيقات للنظام الأم - نظام إدارة الكهرباء

## الميزات الرئيسية:
- **إدارة المستخدمين والصلاحيات**: نظام RBAC متكامل
- **شجرة الحسابات**: هيكل محاسبي مرن
- **القيود اليومية**: إنشاء وترحيل وإلغاء القيود
- **مركز التسوية المرن**: تسوية الحسابات الوسيطة
- **صندوق التحصيل**: إدارة المتحصلين والجلسات
- **التقارير المالية**: ميزان المراجعة، قائمة الدخل، الميزانية
- **تصدير البيانات**: Excel و PDF
    `)
    .setVersion('1.0')
    .setContact('فريق التطوير', '', 'dev@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'أدخل JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('المصادقة', 'تسجيل الدخول والخروج وإدارة التوكنات')
    .addTag('المستخدمين', 'إدارة المستخدمين')
    .addTag('الأدوار', 'إدارة الأدوار والصلاحيات')
    .addTag('المجموعات', 'إدارة المجموعات/الشركات')
    .addTag('المحطات', 'إدارة المحطات')
    .addTag('الحسابات', 'شجرة الحسابات')
    .addTag('القيود', 'القيود اليومية')
    .addTag('التقارير', 'التقارير المالية والمحاسبية')
    .addTag('لوحة التحكم', 'إحصائيات ومؤشرات الأداء')
    .addTag('التسوية', 'مركز التسوية المرن')
    .addTag('صندوق التحصيل', 'إدارة صناديق التحصيل والمتحصلين')
    .addTag('الخدمات', 'كتالوج الخدمات والتسعير')
    .addTag('أوامر الدفع', 'أوامر الدفع المركزي')
    .addTag('الفترات المحاسبية', 'إدارة الفترات المحاسبية')
    .addTag('الإشعارات', 'نظام الإشعارات الداخلي')
    .addTag('تصدير البيانات', 'تصدير التقارير إلى Excel/PDF')
    .build();
  
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    customSiteTitle: 'النظام الأم - API Docs',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { font-size: 2em }
    `,
  });
  
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
