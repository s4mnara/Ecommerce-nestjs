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
import { LogsService } from '../logs-usuario/logs.service';

@Injectable()
export class PedidosService {
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

    private readonly logsService: LogsService, // injetado
  ) {}

  // ============================================================
  // MÉTODO PRINCIPAL — CRIAR PEDIDO COM LOGS
  // ============================================================
  async criarPedidoAPartirDoCarrinho(usuarioId: number) {
    const carrinho = await this.carrinhoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });

    if (!carrinho) {
      await this.logsService.registrarLog({
        usuarioId,
        acao: 'Falha ao criar pedido',
        detalhes: 'Carrinho não encontrado',
      });
      throw new NotFoundException('Carrinho não encontrado para o usuário.');
    }

    if (!carrinho.itens || carrinho.itens.length === 0) {
      await this.logsService.registrarLog({
        usuarioId,
        acao: 'Falha ao criar pedido',
        detalhes: 'Carrinho vazio',
      });
      throw new BadRequestException('Carrinho vazio.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const produtoRepoQR = queryRunner.manager.getRepository(Produto);
      const pedidoRepoQR = queryRunner.manager.getRepository(Pedido);
      const itemPedidoRepoQR = queryRunner.manager.getRepository(ItemPedido);
      const itemCarrinhoRepoQR = queryRunner.manager.getRepository(ItemCarrinho);
      const carrinhoRepoQR = queryRunner.manager.getRepository(Carrinho);

      // 1 — Validação de estoque com lock
      for (const item of carrinho.itens) {
        const produto = await produtoRepoQR.findOne({
          where: { id: item.produto.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!produto) {
          await queryRunner.rollbackTransaction();
          await this.logsService.registrarLog({
            usuarioId,
            acao: 'Falha ao criar pedido',
            detalhes: `Produto ${item.produto.id} não encontrado`,
          });
          throw new NotFoundException(`Produto ${item.produto.id} não encontrado.`);
        }

        if (produto.estoque < item.quantidade) {
          await queryRunner.rollbackTransaction();
          await this.logsService.registrarLog({
            usuarioId,
            acao: 'Falha ao criar pedido',
            detalhes: `Estoque insuficiente para produto ${produto.id}`,
          });
          throw new BadRequestException({
            message: `Estoque insuficiente para o produto "${produto.nome}".`,
            productId: produto.id,
            available: produto.estoque,
          });
        }
      }

      // 2 — Deduzir estoque
      for (const item of carrinho.itens) {
        await produtoRepoQR.decrement(
          { id: item.produto.id } as any,
          'estoque',
          item.quantidade,
        );
      }

      // 3 — Criar pedido
      const totalPedido = carrinho.itens.reduce(
        (acc, it) => acc + Number(it.subtotal),
        0,
      );

      const novoPedido = pedidoRepoQR.create({
        usuario: { id: usuarioId } as Usuario,
        total: totalPedido,
        finalizado: true,
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

        // Log individual por item
        await this.logsService.registrarLog({
          usuarioId,
          acao: 'Item adicionado ao pedido',
          detalhes: {
            pedidoId: pedidoSalvo.id,
            produtoId: item.produto.id,
            quantidade: item.quantidade,
          },
        });
      }

      // 5 — Limpar carrinho
      const itemIds = carrinho.itens.map((i) => i.id);
      if (itemIds.length > 0) {
        await itemCarrinhoRepoQR.delete(itemIds);
      }

      carrinho.itens = [];
      carrinho.total = 0;
      await carrinhoRepoQR.save(carrinho);

      await queryRunner.commitTransaction();

      await this.logsService.registrarLog({
        usuarioId,
        acao: 'Pedido criado com sucesso',
        detalhes: { pedidoId: pedidoSalvo.id, total: totalPedido },
      });

      return {
        success: true,
        message: 'Pedido criado com sucesso.',
        orderId: pedidoSalvo.id,
        total: Number(pedidoSalvo.total),
      };
    } catch (err) {
      try {
        await queryRunner.rollbackTransaction();
      } catch {}

      await this.logsService.registrarLog({
        usuarioId,
        acao: 'Erro ao criar pedido',
        detalhes: { error: err.message },
      });

      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException('Falha ao criar pedido.');
    } finally {
      await queryRunner.release();
    }
  }
}
