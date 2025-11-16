import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  // Enable global validation pipe
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

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Dashwright API')
    .setDescription('API documentation for Dashwright - E2E Testing Dashboard')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for npm package authentication',
      },
      'API-Key',
    )
    .addTag('Authentication', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Organizations', 'Organization management endpoints')
    .addTag('Teams', 'Team management endpoints')
    .addTag('Test Runs', 'Test run management endpoints')
    .addTag('Artifacts', 'Artifact management endpoints')
    .addTag('Integrations', 'Integration management endpoints')
    .addTag('API Keys', 'API key management endpoints')
    .addTag('Invitations', 'User invitation management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Dashwright backend is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation available at: http://localhost:${port}/api`);
}

bootstrap();
