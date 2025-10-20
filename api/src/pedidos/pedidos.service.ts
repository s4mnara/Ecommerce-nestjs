import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../entity/pedido.entity';
import { Carrinho } from '../entity/carrinho.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { ClientKafka } from '@nestjs/microservices';
import { Usuario } from '../entity/usuario.entity';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,

    @InjectRepository(Carrinho)
    private readonly carrinhoRepo: Repository<Carrinho>,

    @InjectRepository(ItemCarrinho)
    private readonly itemRepo: Repository<ItemCarrinho>,

    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

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

    // Limpa o carrinho
    carrinho.itens = [];
    carrinho.total = 0;
    await this.carrinhoRepo.save(carrinho);

    const totalNumber = Number(salvo.total);

    await new Promise(res => setTimeout(res, 500)); // Delay antes de emitir Kafka

    this.kafkaClient.emit('pedido.criado', {
      usuarioId,
      pedidoId: salvo.id,
      total: totalNumber,
    });

    // Mensagem Telegram via Kafka
    this.kafkaClient.emit('telegram.mensagem', {
      telegramChatId: carrinho.usuario.telegramChatId,
      mensagem: `Pedido #${salvo.id} confirmado! Total: R$${totalNumber.toFixed(2)}`
    });

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

