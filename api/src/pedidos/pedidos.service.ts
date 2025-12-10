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

    private readonly logsService: LogsService,
  ) {}

  // ============================================================
  // CRIAR PEDIDO
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
      throw new NotFoundException('Carrinho não encontrado.');
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

      // 1 — Validação de estoque
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
          throw new BadRequestException(
            `Estoque insuficiente para o produto "${produto.nome}".`,
          );
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

      // 3 — Criar pedido pendente
      const totalPedido = carrinho.itens.reduce(
        (acc, it) => acc + Number(it.subtotal),
        0,
      );

      const novoPedido = pedidoRepoQR.create({
        usuario: { id: usuarioId } as Usuario,
        total: totalPedido,
        status: 'pendente' as StatusPedido,
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

      // 6 — Processar pagamento
      const pagamentoSucesso = await this.processarPagamento(usuarioId, totalPedido);

      if (pagamentoSucesso) {
        pedidoSalvo.status = 'finalizado';
        await pedidoRepoQR.save(pedidoSalvo);

        await this.logsService.registrarLog({
          usuarioId,
          acao: 'Pedido finalizado',
          detalhes: { pedidoId: pedidoSalvo.id, total: totalPedido },
        });
      } else {
        await this.logsService.registrarLog({
          usuarioId,
          acao: 'Pagamento falhou - pedido pendente',
          detalhes: { pedidoId: pedidoSalvo.id, total: totalPedido },
        });
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: pagamentoSucesso
          ? 'Pedido criado e finalizado com sucesso.'
          : 'Pedido criado, aguardando pagamento.',
        orderId: pedidoSalvo.id,
        total: Number(pedidoSalvo.total),
        status: pedidoSalvo.status,
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

  // ============================================================
  // MÉTODO SIMULADO DE PAGAMENTO
  // ============================================================
  private async processarPagamento(
    usuarioId: number,
    total: number,
  ): Promise<boolean> {
    // Simulação: 80% de chance de sucesso
    return Math.random() > 0.2;
  }

  // ============================================================
  // ATUALIZAR STATUS MANUALMENTE
  // ============================================================
  async atualizarStatusPedido(pedidoId: number, status: StatusPedido) {
    const pedido = await this.pedidoRepo.findOne({
      where: { id: pedidoId },
      relations: ['usuario'],
    });

    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    pedido.status = status;
    await this.pedidoRepo.save(pedido);

    await this.logsService.registrarLog({
      usuarioId: pedido.usuario.id,
      acao: `Pedido ${status}`,
      detalhes: { pedidoId: pedido.id },
    });

    return pedido;
  }

  // ============================================================
  // LISTAR PEDIDOS
  // ============================================================
  async listarPedidosPendentes() {
    return this.pedidoRepo.find({
      where: { status: 'pendente' },
      relations: ['usuario', 'itens', 'itens.produto'],
      order: { id: 'DESC' },
    });
  }

  async findByUsuarioId(usuarioId: number) {
    return this.pedidoRepo.find({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto'],
      order: { id: 'DESC' },
    });
  }

  async findAll() {
    return this.pedidoRepo.find({
      relations: ['usuario', 'itens', 'itens.produto'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: ['usuario', 'itens', 'itens.produto'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    return pedido;
  }

  async remove(id: number) {
    const pedido = await this.findOne(id);
    await this.pedidoRepo.remove(pedido);
  }
}
