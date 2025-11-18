// src/pagamento/pagamentos.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Pedido } from '../entity/pedido.entity';
import { ItemPedido } from '../entity/item-pedido.entity';
import { Carrinho } from '../entity/carrinho.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { Produto } from '../entity/produto.entity';
import { Usuario } from '../entity/usuario.entity';

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
  ) {}

  /**
   * PROCESSA PAGAMENTO FALSO COM TRANSAÇÃO E LOCK PESSIMISTA
   */
  async processarPagamentoFalso(usuarioId: number) {
    // 1) Buscar o carrinho e itens
    const carrinho = await this.carrinhoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario', 'itens', 'itens.produto'],
    });

    if (!carrinho) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    if (carrinho.itens.length === 0) {
      throw new BadRequestException('Seu carrinho está vazio');
    }

    // 2) Criar QueryRunner para transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Repositórios sob transação
      const produtoRepoQR = queryRunner.manager.getRepository(Produto);
      const pedidoRepoQR = queryRunner.manager.getRepository(Pedido);
      const itemPedidoRepoQR = queryRunner.manager.getRepository(ItemPedido);
      const carrinhoRepoQR = queryRunner.manager.getRepository(Carrinho);
      const itemCarrinhoRepoQR = queryRunner.manager.getRepository(ItemCarrinho);

      // 3) Validar estoque com LOCK pessimistc write
      for (const item of carrinho.itens) {
        const produto = await produtoRepoQR.findOne({
          where: { id: item.produto.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!produto) {
          await queryRunner.rollbackTransaction();
          throw new NotFoundException(`Produto ${item.produto.id} não encontrado.`);
        }

        if (produto.estoque < item.quantidade) {
          await queryRunner.rollbackTransaction();
          throw new BadRequestException({
            message: `Estoque insuficiente para o produto "${produto.nome}".`,
            productId: produto.id,
            disponivel: produto.estoque,
          });
        }
      }

      // 4) Subtrair estoque
      for (const item of carrinho.itens) {
        await produtoRepoQR.decrement(
          { id: item.produto.id },
          'estoque',
          item.quantidade,
        );
      }

      // 5) Criar pedido
      const totalPedido = carrinho.itens.reduce(
        (acc, item) => acc + Number(item.subtotal),
        0,
      );

      const novoPedido = pedidoRepoQR.create({
        usuario: { id: usuarioId } as Usuario,
        total: totalPedido,
        finalizado: true, // marca como concluído (pagamento falso)
      });

      const pedidoSalvo = await pedidoRepoQR.save(novoPedido);

      // 6) Criar itens do pedido
      for (const item of carrinho.itens) {
        const itemPedido = itemPedidoRepoQR.create({
          pedido: pedidoSalvo,
          produto: item.produto,
          quantidade: item.quantidade,
          subtotal: item.subtotal,
        });
        await itemPedidoRepoQR.save(itemPedido);
      }

      // 7) Limpar carrinho
      await itemCarrinhoRepoQR.remove(carrinho.itens);

      carrinho.itens = [];
      carrinho.total = 0;

      await carrinhoRepoQR.save(carrinho);

      // 8) Commit final
      await queryRunner.commitTransaction();

      // 9) Retorno para frontend
      return {
        success: true,
        message: 'Pagamento simulado concluído com sucesso!',
        orderId: pedidoSalvo.id,
        url: `http://localhost:3000/pagamento/sucesso/${pedidoSalvo.id}`,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('ERRO NO PAGAMENTO FALSO → ', err);

      if (err.status) throw err;

      throw new InternalServerErrorException(
        'Falha ao processar pagamento simulado',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ROTA DE SUCESSO (MOSTRA RESUMO DO PEDIDO)
   */
  async obterResumoPedido(orderId: number) {
    const pedido = await this.pedidoRepo.findOne({
      where: { id: orderId },
      relations: ['usuario', 'itens', 'itens.produto'],
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

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
      finalizado: pedido.finalizado,
    };
  }
}
