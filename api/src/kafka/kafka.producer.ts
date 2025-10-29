import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaProducer implements OnModuleInit {
  constructor(@Inject('KAFKA_SERVICE') private readonly client: ClientKafka) {}

  async onModuleInit() {
    // Inicializa a conexão com Kafka
    await this.client.connect();
  }

  // Método genérico
  emit(topic: string, payload: any) {
    return this.client.emit(topic, payload);
  }

  // Métodos específicos reaproveitando o emit
  async enviarProdutoAdicionado(usuarioId: number, produtoId: number, quantidade: number, totalAtual: number) {
    await this.emit('carrinho.produto.adicionado', { usuarioId, produtoId, quantidade, totalAtual });
  }

  async enviarProdutoRemovido(usuarioId: number, produtoId: number, totalAtual: number) {
    await this.emit('carrinho.produto.removido', { usuarioId, produtoId, totalAtual });
  }

  async enviarCarrinhoLimpo(usuarioId: number) {
    await this.emit('carrinho.limpo', { usuarioId });
  }

  async enviarUsuarioCadastrado(usuarioId: number, nome: string) {
    await this.emit('usuario.cadastrado', { usuarioId, nome });
  }

  async enviarPedidoFinalizado(usuarioId: number, pedidoId: number, total: number) {
    await this.emit('pedido.finalizado', { usuarioId, pedidoId, total });
  }
}

