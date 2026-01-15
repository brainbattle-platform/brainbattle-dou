import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';
import { createSwaggerDocumentOptions, filterSwaggerDocument } from './common/swagger/swagger-document.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('BrainBattle Duo API')
    .setDescription('Duolingo-style learning service (MVP). Legacy endpoints under /api/duo/* are hidden by default. Set SHOW_LEGACY_SWAGGER=true to show them.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config, createSwaggerDocumentOptions());
  const filteredDocument = filterSwaggerDocument(document);
  SwaggerModule.setup('api/docs', app, filteredDocument);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`BrainBattle Duo service is running on port ${port}`);
  console.log(`Swagger UI available at http://0.0.0.0:${port}/api/docs`);
}
bootstrap();
