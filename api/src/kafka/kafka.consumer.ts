// src/kafka/kafka.consumer.ts

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
        const { usuarioId, produtoId, quantidade, totalAtual } = message.value;

        const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
        if (!usuario) return;

        const mensagem = `Você adicionou ${quantidade} unidade(s) do produto ${produtoId} ao seu carrinho. Total atual: R$ ${totalAtual}.`;

        if (usuario.telegramChatId) {
            await this.telegramService.enviarMensagem(
                usuario.telegramChatId,
                `Produto adicionado ao carrinho!\n\n${mensagem}`
            );
        }
    }

    @EventPattern('carrinho.produto.removido')
    async handleProdutoRemovido(@Payload() message: any) {
        const { usuarioId, produtoId, totalAtual } = message.value;

        const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
        if (!usuario) return;

        const mensagem = `Você removeu o produto ${produtoId} do seu carrinho. Total atual: R$ ${totalAtual}.`;
        
        if (usuario.telegramChatId) {
            await this.telegramService.enviarMensagem(
                usuario.telegramChatId,
                `Produto removido do carrinho!\n\n${mensagem}`
            );
        }
    }

    @EventPattern('carrinho.limpo')
    async handleCarrinhoLimpo(@Payload() message: any) {
        const { usuarioId } = message.value;

        const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
        if (!usuario) return;

        const mensagem = `Seu carrinho foi limpo.`;

        if (usuario.telegramChatId) {
            await this.telegramService.enviarMensagem(
                usuario.telegramChatId,
                `Carrinho limpo!\n\n${mensagem}`
            );
        }
    }
}