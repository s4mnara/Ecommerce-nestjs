import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Cria a aplicação NestJS
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000', // origem do frontend React
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });



  // Conecta o microservice Kafka para consumir eventos
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER || 'kafka:9092'], // host do Kafka (Docker ou variável .env)
      },
      consumer: {
        groupId: 'loja-consumer', // groupId consistente para todos os consumidores
      },
    },
  });

  // Inicia o microservice Kafka antes da API HTTP
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0'); // inicia a API HTTP
  console.log(`API rodando na porta ${process.env.PORT ?? 3000}`);
}

bootstrap();

