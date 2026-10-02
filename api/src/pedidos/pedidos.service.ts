import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
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
import { PagamentosService } from '../pagamento/pagamentos.service';
import { ProcessarPagamentoDto } from '../pagamento/dto/processar-pagamento.dto';
import { Pagamento } from 'src/entity/pagamento.entity';
import Redis from 'ioredis';

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

    @InjectRepository(Pagamento)
    private pagamentoRepo: Repository<Pagamento>,

    private readonly pagamentosService: PagamentosService,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  // ============================================================
  // CRIAR PEDIDO
  // ============================================================
  async criarPedidoAPartirDoCarrinho(
    usuarioId: number,
    pagamentoDto: ProcessarPagamentoDto,
  ) {
    if (!pagamentoDto?.metodo) {
      throw new BadRequestException('Método de pagamento é obrigatório');
    }

    const carrinho = await this.carrinhoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto'],
    });

    if (!carrinho || !carrinho.itens?.length) {
      throw new BadRequestException('Carrinho vazio.');
    }

    const total = carrinho.itens.reduce(
      (acc, i) => acc + Number(i.subtotal ?? 0),
      0,
    );

    if (!Number.isFinite(total) || total <= 0) {
      throw new BadRequestException('Total do carrinho inválido.');
    }

    // Processa pagamento ANTES da transação (falhas de validação não abrem TX)
    let resultadoPagamento;
    switch (pagamentoDto.metodo) {
      case 'cartao':
        if (!pagamentoDto.numeroCartao || !pagamentoDto.parcelas) {
          throw new BadRequestException('Dados do cartão inválidos');
        }
        resultadoPagamento = await this.pagamentosService.pagarComCartao(
          total,
          pagamentoDto.parcelas,
          pagamentoDto.numeroCartao,
        );
        break;

      case 'pix':
        resultadoPagamento = await this.pagamentosService.pagarComPix(total);
        break;

      case 'boleto':
        resultadoPagamento =
          await this.pagamentosService.pagarComBoleto(total);
        break;

      default:
        throw new BadRequestException('Método inválido');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedidoRepo = queryRunner.manager.getRepository(Pedido);
      const itemPedidoRepo = queryRunner.manager.getRepository(ItemPedido);
      const pagamentoRepo = queryRunner.manager.getRepository(Pagamento);
      const carrinhoRepo = queryRunner.manager.getRepository(Carrinho);
      const itemCarrinhoRepo = queryRunner.manager.getRepository(ItemCarrinho);

      const pedido = pedidoRepo.create({
        usuario: { id: usuarioId } as Usuario,
        total,
        status:
          resultadoPagamento.status === 'APPROVED'
            ? 'finalizado'
            : 'pendente',
      });

      const pedidoSalvo = await pedidoRepo.save(pedido);

      for (const item of carrinho.itens) {
        await itemPedidoRepo.save({
          pedido: pedidoSalvo,
          produto: item.produto,
          quantidade: item.quantidade,
          subtotal: item.subtotal,
        });
      }

      await pagamentoRepo.save({
        pedido: { id: pedidoSalvo.id } as Pedido,
        metodo: resultadoPagamento.metodo,
        status: resultadoPagamento.status,
        valorOriginal: resultadoPagamento.valorOriginal ?? total,
        valorFinal: resultadoPagamento.valorFinal ?? total,
        parcelas: resultadoPagamento.parcelas ?? null,
        bandeira: resultadoPagamento.bandeira ?? null,
        codigoPix: resultadoPagamento.qrCode ?? null,
        linhaDigitavelBoleto: resultadoPagamento.codigoBoleto ?? null,
        transactionId: resultadoPagamento.transacaoId,
      });

      const itemIds = carrinho.itens.map((i) => i.id).filter(Boolean);
      if (itemIds.length) {
        await itemCarrinhoRepo.delete(itemIds);
      }

      carrinho.itens = [];
      carrinho.total = 0;
      await carrinhoRepo.save(carrinho);

      await queryRunner.commitTransaction();

      // Invalida cache do carrinho (DB já foi limpo na TX)
      await this.redis.del(`carrinho:${usuarioId}`);

      return {
        pedidoId: pedidoSalvo.id,
        status: pedidoSalvo.status,
        pagamento: resultadoPagamento,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
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
    const pedidos = await this.pedidoRepo.find({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'pagamentos'],
      order: { id: 'DESC' },
    });

    // Evita referência circular Pedido <-> Pagamento na serialização JSON
    return pedidos.map((pedido) => {
      const { usuario, pagamentos, itens, ...rest } = pedido;
      return {
        ...rest,
        usuario: usuario
          ? {
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
              role: usuario.role,
            }
          : undefined,
        itens: (itens || []).map((item) => ({
          id: item.id,
          quantidade: item.quantidade,
          subtotal: item.subtotal,
          produto: item.produto
            ? {
                id: item.produto.id,
                nome: item.produto.nome,
                preco: item.produto.preco,
                imagem: item.produto.imagem,
              }
            : null,
        })),
        pagamentos: (pagamentos || []).map((p) => ({
          id: p.id,
          metodo: p.metodo,
          status: p.status,
          valorOriginal: p.valorOriginal,
          valorFinal: p.valorFinal,
          parcelas: p.parcelas,
          bandeira: p.bandeira,
          codigoPix: p.codigoPix,
          linhaDigitavelBoleto: p.linhaDigitavelBoleto,
          transactionId: p.transactionId,
          criadoEm: p.criadoEm,
        })),
      };
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
