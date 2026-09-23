import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ativa a validação dos DTOs globalmente
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Libera o CORS para o Angular
  app.enableCors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  await app.listen(3000);
}
bootstrap();
