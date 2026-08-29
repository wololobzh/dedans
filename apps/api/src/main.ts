import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port, '0.0.0.0');

  console.log(`School ERP API listening on http://localhost:${port}`);
}

void bootstrap();
