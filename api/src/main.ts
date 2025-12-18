import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // Inicializa o app com suporte a Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Habilita CORS para o frontend React
app.enableCors({
  origin: true,  // Aceita qualquer origem
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
});


  app.use(express.json());

  // Servir imagens da pasta "uploads"
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Inicia o servidor HTTP
  const port = process.env.PORT ?? 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API rodando na porta ${port}`);
  console.log(`📂 Servindo imagens em: http://${process.env.REACT_APP_API_URL}:${port}/uploads/`);
}

bootstrap();


