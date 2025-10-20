import { Injectable } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TelegramService } from '../telegram/telegram.service';
import { Repository } from 'typeorm';
import { Usuario } from '../entity/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class KafkaConsumer {
    constructor(
        private readonly telegramService: TelegramService,
        @InjectRepository(Usuario)
        private readonly usuarioRepo: Repository<Usuario>,
    ) {}

    @EventPattern('carrinho.produto.adicionado')
    async handleProdutoAdicionado(@Payload() message: any) {
        const payload = message.value || message;
        const { usuarioId, produtoId, quantidade, totalAtual } = payload;
        const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
        if (!usuario || !usuario.telegramChatId) return;

        const mensagem = `Você adicionou ${quantidade} unidade(s) do produto ${produtoId} ao seu carrinho. Total atual: R$ ${totalAtual}.`;
        await this.telegramService.enviarMensagem(usuario.telegramChatId, `Produto adicionado ao carrinho!\n\n${mensagem}`);
    }

    @EventPattern('carrinho.produto.removido')
    async handleProdutoRemovido(@Payload() message: any) {
        const payload = message.value || message;
        const { usuarioId, produtoId, totalAtual } = payload;
        const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
        if (!usuario || !usuario.telegramChatId) return;

        const mensagem = `Você removeu o produto ${produtoId} do seu carrinho. Total atual: R$ ${totalAtual}.`;
        await this.telegramService.enviarMensagem(usuario.telegramChatId, `Produto removido do carrinho!\n\n${mensagem}`);
    }

    @EventPattern('carrinho.limpo')
    async handleCarrinhoLimpo(@Payload() message: any) {
        const payload = message.value || message;
        const { usuarioId } = payload;
        const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
        if (!usuario || !usuario.telegramChatId) return;

        await this.telegramService.enviarMensagem(usuario.telegramChatId, `Carrinho limpo!\n\nSeu carrinho foi limpo.`);
    }

    @EventPattern('telegram.mensagem')
    async handleTelegramMessage(@Payload() message: any) {
        const payload = message.value || message;
        
        console.log('[KafkaConsumer] Recebido evento telegram.mensagem. Payload:', payload);
        
        const { telegramChatId, mensagem } = payload;
        
        if (!telegramChatId) {
            console.error('[KafkaConsumer] Descartando: telegramChatId está ausente ou nulo.');
            return;
        }
        if (!mensagem) {
            console.error('[KafkaConsumer] Descartando: Mensagem de texto ausente.');
            return;
        }

        await this.telegramService.enviarMensagem(telegramChatId.toString(), mensagem);
        console.log(`[KafkaConsumer] Mensagem de Pedido CONFIRMADA e enviada via TelegramService para: ${telegramChatId}`);
    }
}