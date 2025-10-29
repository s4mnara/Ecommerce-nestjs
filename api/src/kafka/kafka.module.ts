import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaProducer } from './kafka.producer';
import { KafkaConsumer } from './kafka.consumer';
import { TelegramModule } from '../telegram/telegram.module';
import { Usuario } from '../entity/usuario.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
    TelegramModule,
    TypeOrmModule.forFeature([Usuario]),

    // Apenas para producer
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'ecommerce-producer',
              brokers: [configService.get<string>('KAFKA_BROKER') || 'kafka:9092'],
              retry: { initialRetryTime: 300, retries: 5 },
            },
            producer: { allowAutoTopicCreation: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaProducer, KafkaConsumer],
  exports: [KafkaProducer, ClientsModule],
})
export class KafkaModule {}

