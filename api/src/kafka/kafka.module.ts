// src/kafka/kafka.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaConsumer } from './kafka.consumer';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { brokers: ['kafka:9092'] }, // mesmo nome do container
          consumer: { groupId: 'loja-consumer' },
        },
      },
    ]),
  ],
  providers: [KafkaConsumer],
  exports: [ClientsModule],
})
export class KafkaModule {}
