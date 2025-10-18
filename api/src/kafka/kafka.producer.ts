// src/kafka/kafka.producer.ts
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaProducer implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async enviarProdutoAdicionado(usuarioId: number, produtoId: number, quantidade: number, totalAtual: number) {
    await this.kafkaClient.emit('carrinho.produto.adicionado', {
      usuarioId,
      produtoId,
      quantidade,
      totalAtual,
    });
  }

  async enviarProdutoRemovido(usuarioId: number, produtoId: number, totalAtual: number) {
    await this.kafkaClient.emit('carrinho.produto.removido', {
      usuarioId,
      produtoId,
      totalAtual,
    });
  }

  async enviarCarrinhoLimpo(usuarioId: number) {
    await this.kafkaClient.emit('carrinho.limpo', { usuarioId });
  }
}
