import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const port = Number(configService.get<string>('PORT', '4000'));
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:3000',
  );

  app.setGlobalPrefix(apiPrefix);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
  logger.log(`Prime Maestros Hub API running on http://localhost:${port}/${apiPrefix}`);
}

void bootstrap();
