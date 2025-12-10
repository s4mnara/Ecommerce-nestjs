// src/pagamento/pagamentos.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Pedido, StatusPedido } from '../entity/pedido.entity';
import { ItemPedido } from '../entity/item-pedido.entity';
import { Carrinho } from '../entity/carrinho.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { Produto } from '../entity/produto.entity';
import { Usuario } from '../entity/usuario.entity';
import { LogsService } from '../logs-usuario/logs.service';

@Injectable()
export class PagamentosService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(Pedido)
    private pedidoRepo: Repository<Pedido>,

    @InjectRepository(ItemPedido)
    private itemPedidoRepo: Repository<ItemPedido>,

    @InjectRepository(Carrinho)
    private carrinhoRepo: Repository<Carrinho>,

    @InjectRepository(ItemCarrinho)
    private itemCarrinhoRepo: Repository<ItemCarrinho>,

    @InjectRepository(Produto)
    private produtoRepo: Repository<Produto>,

    private readonly logsService: LogsService,
  ) {}

  // Adicione dentro do PagamentosService
async obterResumoPedido(orderId: number) {
  const pedido = await this.pedidoRepo.findOne({
    where: { id: orderId },
    relations: ['usuario', 'itens', 'itens.produto'],
  });

  if (!pedido) throw new NotFoundException('Pedido não encontrado');

  return {
    id: pedido.id,
    usuario: {
      id: pedido.usuario.id,
      nome: pedido.usuario.nome,
      email: pedido.usuario.email,
    },
    total: Number(pedido.total),
    itens: pedido.itens.map((item) => ({
      produtoId: item.produto.id,
      nome: item.produto.nome,
      quantidade: item.quantidade,
      subtotal: Number(item.subtotal),
    })),
    status: pedido.status,
  };
}


  // ============================================================
  // PROCESSAR PAGAMENTO FALSO (SIMULADO)
  // ============================================================
  async processarPagamentoFalso(usuarioId: number) {
    const carrinho = await this.carrinhoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });

    if (!carrinho) throw new NotFoundException('Carrinho não encontrado.');
    if (!carrinho.itens || carrinho.itens.length === 0)
      throw new BadRequestException('Carrinho vazio.');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const produtoRepoQR = queryRunner.manager.getRepository(Produto);
      const pedidoRepoQR = queryRunner.manager.getRepository(Pedido);
      const itemPedidoRepoQR = queryRunner.manager.getRepository(ItemPedido);
      const itemCarrinhoRepoQR = queryRunner.manager.getRepository(ItemCarrinho);
      const carrinhoRepoQR = queryRunner.manager.getRepository(Carrinho);

      // 1 — Validar estoque
      for (const item of carrinho.itens) {
        const produto = await produtoRepoQR.findOne({
          where: { id: item.produto.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!produto) throw new NotFoundException(`Produto ${item.produto.id} não encontrado.`);
        if (produto.estoque < item.quantidade)
          throw new BadRequestException(`Estoque insuficiente para "${produto.nome}".`);
      }

      // 2 — Deduzir estoque
      for (const item of carrinho.itens) {
        await produtoRepoQR.decrement({ id: item.produto.id } as any, 'estoque', item.quantidade);
      }

      // 3 — Criar pedido finalizado
      const totalPedido = carrinho.itens.reduce((acc, it) => acc + Number(it.subtotal), 0);
      const novoPedido = pedidoRepoQR.create({
        usuario: { id: usuarioId } as Usuario,
        total: totalPedido,
        status: 'finalizado' as StatusPedido,
      });

      const pedidoSalvo = await pedidoRepoQR.save(novoPedido);

      // 4 — Criar itens do pedido
      for (const item of carrinho.itens) {
        const itemPedido = itemPedidoRepoQR.create({
          pedido: pedidoSalvo,
          produto: item.produto,
          quantidade: item.quantidade,
          subtotal: item.subtotal,
        });
        await itemPedidoRepoQR.save(itemPedido);
      }

      // 5 — Limpar carrinho
      const itemIds = carrinho.itens.map((i) => i.id);
      if (itemIds.length > 0) await itemCarrinhoRepoQR.delete(itemIds);

      carrinho.itens = [];
      carrinho.total = 0;
      await carrinhoRepoQR.save(carrinho);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Pagamento simulado concluído com sucesso!',
        orderId: pedidoSalvo.id,
        total: Number(pedidoSalvo.total),
        status: pedidoSalvo.status,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Erro pagamento falso → ', err);
      throw new InternalServerErrorException('Falha ao processar pagamento simulado.');
    } finally {
      await queryRunner.release();
    }
  }
}

