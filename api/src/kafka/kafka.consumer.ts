import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TelegramService } from '../telegram/telegram.service';
import { Repository } from 'typeorm';
import { Usuario } from '../entity/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class KafkaConsumer {
  private readonly logger = new Logger(KafkaConsumer.name);

  constructor(
    private readonly telegramService: TelegramService,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  private async enviarMensagem(usuarioId: number, mensagem: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      this.logger.warn(`Usuário ID ${usuarioId} não encontrado`);
      return;
    }
    if (!usuario.telegramChatId) {
      this.logger.warn(`Usuário ID ${usuarioId} não tem telegramChatId`);
      return;
    }

    this.logger.log(`Enviando mensagem para usuário ID ${usuarioId} (chatId: ${usuario.telegramChatId})`);
    await this.telegramService.enviarMensagem(usuario.telegramChatId, mensagem);
  }

  @EventPattern('carrinho.produto.adicionado')
  async handleProdutoAdicionado(@Payload() message: any) {
    const payload = message.value || message;
    this.logger.log(`Evento recebido: carrinho.produto.adicionado | Payload: ${JSON.stringify(payload)}`);

    const { usuarioId, produtoId, quantidade, totalAtual } = payload;
    const mensagem = `Você adicionou ${quantidade} unidade(s) do produto ${produtoId} ao seu carrinho. Total atual: R$ ${totalAtual}.`;
    await this.enviarMensagem(usuarioId, `Produto adicionado ao carrinho!\n\n${mensagem}`);
  }

  @EventPattern('carrinho.produto.removido')
  async handleProdutoRemovido(@Payload() message: any) {
    const payload = message.value || message;
    this.logger.log(`Evento recebido: carrinho.produto.removido | Payload: ${JSON.stringify(payload)}`);

    const { usuarioId, produtoId, totalAtual } = payload;
    const mensagem = `Você removeu o produto ${produtoId} do seu carrinho. Total atual: R$ ${totalAtual}.`;
    await this.enviarMensagem(usuarioId, `Produto removido do carrinho!\n\n${mensagem}`);
  }

  @EventPattern('carrinho.limpo')
  async handleCarrinhoLimpo(@Payload() message: any) {
    const payload = message.value || message;
    this.logger.log(`Evento recebido: carrinho.limpo | Payload: ${JSON.stringify(payload)}`);

    const { usuarioId } = payload;
    await this.enviarMensagem(usuarioId, `Carrinho limpo!\n\nSeu carrinho foi limpo.`);
  }

  @EventPattern('telegram.mensagem')
  async handleTelegramMessage(@Payload() message: any) {
    const payload = message.value || message;
    this.logger.log(`Evento recebido: telegram.mensagem | Payload: ${JSON.stringify(payload)}`);

    const { telegramChatId, mensagem } = payload;
    if (!telegramChatId || !mensagem) {
      this.logger.warn('Payload inválido para telegram.mensagem');
      return;
    }

    await this.telegramService.enviarMensagem(telegramChatId.toString(), mensagem);
  }

  @EventPattern('usuario.cadastrado')
  async handleUsuarioCadastrado(@Payload() message: any) {
    const payload = message.value || message;
    this.logger.log(`Evento recebido: usuario.cadastrado | Payload: ${JSON.stringify(payload)}`);

    const { usuarioId, nome } = payload;
    const mensagem = `👋 Olá ${nome}! Seu cadastro foi realizado com sucesso.`;
    await this.enviarMensagem(usuarioId, mensagem);
  }

  @EventPattern('pedido.finalizado')
  async handlePedidoFinalizado(@Payload() message: any) {
    const payload = message.value || message;
    this.logger.log(`Evento recebido: pedido.finalizado | Payload: ${JSON.stringify(payload)}`);

    const { usuarioId, pedidoId, total } = payload;
    const mensagem = `Pedido #${pedidoId} confirmado!\nTotal: R$${total.toFixed(2)}`;
    await this.enviarMensagem(usuarioId, mensagem);
  }
}
