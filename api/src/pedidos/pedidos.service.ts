import { Injectable, NotFoundException, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../entity/pedido.entity';
import { Carrinho } from '../entity/carrinho.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { ClientKafka } from '@nestjs/microservices';
import { Usuario } from '../entity/usuario.entity';
import { Produto } from '../entity/produto.entity';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class PedidosService implements OnModuleInit {
    private readonly logger = new Logger(PedidosService.name);

    constructor(
        @InjectRepository(Pedido)
        private readonly pedidoRepo: Repository<Pedido>,

        @InjectRepository(Carrinho)
        private readonly carrinhoRepo: Repository<Carrinho>,

        @InjectRepository(ItemCarrinho)
        private readonly itemRepo: Repository<ItemCarrinho>,

        @InjectRepository(Produto)
        private readonly produtoRepo: Repository<Produto>,

        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
        private readonly telegramService: TelegramService,
    ) {}

    async onModuleInit() {
        this.kafkaClient.subscribeToResponseOf('estoque.atualizado');
        this.kafkaClient.subscribeToResponseOf('pedido.criado');
        this.kafkaClient.subscribeToResponseOf('pedido.atualizado');
        this.kafkaClient.subscribeToResponseOf('pedido.removido');
        
        await this.kafkaClient.connect();
    }

    private async enviarTelegram(usuario: Usuario, mensagem: string) {
        if (!usuario || !usuario.telegramChatId) {
            this.logger.warn(`Usuário ${usuario?.id || 'desconhecido'} não possui telegramChatId definido. Mensagem não será enviada.`);
            return;
        }
        await this.telegramService.enviarMensagem(usuario.telegramChatId.toString(), mensagem);
    }

    async findAll(): Promise<Pedido[]> {
        return this.pedidoRepo.find({ relations: ['usuario', 'itens', 'itens.produto'] });
    }

    async findOne(id: number): Promise<Pedido> {
        const pedido = await this.pedidoRepo.findOne({
            where: { id },
            relations: ['usuario', 'itens', 'itens.produto'],
        });
        if (!pedido) throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
        return pedido;
    }

    async criarPedido(usuarioId: number): Promise<Pedido> {
        const carrinho = await this.carrinhoRepo.findOne({
            where: { usuario: { id: usuarioId } },
            relations: ['itens', 'itens.produto', 'usuario'],
        });

        if (!carrinho || carrinho.itens.length === 0) {
            throw new NotFoundException('Carrinho vazio ou não encontrado');
        }

        const usuario = carrinho.usuario;
        const totalNumber = Number(carrinho.total);

        const pedido = this.pedidoRepo.create({
            usuario: { id: usuarioId } as Usuario,
            total: carrinho.total,
            finalizado: true,
            itens: carrinho.itens.map(item => ({
                produto: item.produto,
                quantidade: item.quantidade,
                subtotal: item.subtotal,
            })),
        });

        const salvo = await this.pedidoRepo.save(pedido);

        for (const item of carrinho.itens) {
            const produto = await this.produtoRepo.findOne({ where: { id: item.produto.id } });
            if (!produto) continue;

            produto.estoque -= item.quantidade;
            await this.produtoRepo.save(produto);

            this.kafkaClient.emit('estoque.atualizado', {
                produtoId: produto.id,
                estoqueAtual: produto.estoque,
            });
        }

        carrinho.itens = [];
        carrinho.total = 0;
        await this.carrinhoRepo.save(carrinho);

        // Evento Kafka para o pedido criado (para outros microservices)
        this.kafkaClient.emit('pedido.criado', {
            usuarioId,
            pedidoId: salvo.id,
            total: totalNumber,
        });

        // Chamada DIRETA ao TelegramService (igual ao CarrinhoService)
        const mensagemConfirmacao = `Pedido #${salvo.id} confirmado! Total: R$${totalNumber.toFixed(2)}`;
        await this.enviarTelegram(usuario, mensagemConfirmacao);

        return salvo;
    }

    async update(id: number, data: Partial<Pedido>): Promise<Pedido> {
        const pedido = await this.findOne(id);
        Object.assign(pedido, data);
        const salvo = await this.pedidoRepo.save(pedido);

        this.kafkaClient.emit('pedido.atualizado', {
            pedidoId: salvo.id,
            ...data,
        });

        return salvo;
    }

    async remove(id: number): Promise<void> {
        const pedido = await this.findOne(id);
        await this.pedidoRepo.remove(pedido);

        this.kafkaClient.emit('pedido.removido', { pedidoId: id });
    }
}


