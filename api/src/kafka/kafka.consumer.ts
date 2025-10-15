// src/kafka/kafka.consumer.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka, Payload, EventPattern } from '@nestjs/microservices';

@Injectable()
export class KafkaConsumer implements OnModuleInit {
  constructor(private readonly kafkaClient: ClientKafka) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  @EventPattern('produto.adicionado')
  async handleProdutoAdicionado(@Payload() message: any) {
    console.log('Produto adicionado ao carrinho:', message.value);
  }
}
