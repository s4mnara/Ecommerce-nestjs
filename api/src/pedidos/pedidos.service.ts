import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../entity/pedido.entity';
import { Carrinho } from '../entity/carrinho.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { Produto } from '../entity/produto.entity';
import { Usuario } from '../entity/usuario.entity';

@Injectable()
export class PedidosService {
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
  ) {}

  /**
   * Cria um pedido com base no carrinho do usuário e o limpa após salvar.
   */
  async criarPedido(usuarioId: number): Promise<Pedido> {
    const carrinho = await this.carrinhoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });

    if (!carrinho || carrinho.itens.length === 0)
      throw new NotFoundException('Carrinho vazio ou não encontrado');

    const totalPedido = carrinho.itens.reduce((acc, item) => acc + item.subtotal, 0);

    const pedido = this.pedidoRepo.create({
      usuario: { id: usuarioId } as Usuario,
      total: totalPedido,
      finalizado: true,
      itens: carrinho.itens.map(item => ({
        produto: item.produto,
        quantidade: item.quantidade,
        subtotal: item.subtotal,
      })),
    });

    const salvo = await this.pedidoRepo.save(pedido);

    // Atualiza o estoque dos produtos
    for (const item of carrinho.itens) {
      const produto = await this.produtoRepo.findOne({ where: { id: item.produto.id } });
      if (produto) {
        produto.estoque = Math.max(produto.estoque - item.quantidade, 0);
        await this.produtoRepo.save(produto);
      }
    }

    // Limpa o carrinho do usuário
    carrinho.itens = [];
    carrinho.total = 0;
    await this.carrinhoRepo.save(carrinho);

    this.logger.log(`Pedido ${salvo.id} criado e carrinho limpo para usuário ${usuarioId}`);
    return salvo;
  }

  /**
   * Retorna todos os pedidos de um usuário específico
   */
  async findByUsuarioId(usuarioId: number): Promise<any[]> {
    const pedidos = await this.pedidoRepo.find({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto'],
      order: { id: 'DESC' },
    });

    return pedidos.map(pedido => ({
      id: pedido.id,
      data: new Date(pedido['createdAt'] || Date.now()).toLocaleDateString('pt-BR'),
      total: Number(pedido.total || 0),
      itens: pedido.itens.map(item => ({
        id: item.produto.id,
        nome: item.produto.nome,
        quantidade: item.quantidade,
      })),
    }));
  }

  async findAll(): Promise<Pedido[]> {
    return this.pedidoRepo.find({
      relations: ['usuario', 'itens', 'itens.produto'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: ['usuario', 'itens', 'itens.produto'],
    });
    if (!pedido) throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    return pedido;
  }

  async update(id: number, data: Partial<Pedido>): Promise<Pedido> {
    const pedido = await this.findOne(id);
    Object.assign(pedido, data);
    return this.pedidoRepo.save(pedido);
  }

  async remove(id: number): Promise<void> {
    const pedido = await this.findOne(id);
    await this.pedidoRepo.remove(pedido);
  }
}
