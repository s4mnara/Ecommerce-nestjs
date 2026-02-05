import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
  ) {}

  // ============================================================
  // CRIAR PEDIDO
  // ============================================================
  async criarPedidoAPartirDoCarrinho(
    usuarioId: number,
    pagamentoDto: ProcessarPagamentoDto,
  ) {
    const carrinho = await this.carrinhoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto'],
    });

    if (!carrinho || !carrinho.itens.length) {
      throw new BadRequestException('Carrinho vazio.');
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

      const total = carrinho.itens.reduce(
        (acc, i) => acc + Number(i.subtotal),
        0,
      );

      let resultadoPagamento;

      switch (pagamentoDto.metodo) {
        case 'cartao':
          if (!pagamentoDto.numeroCartao || !pagamentoDto.parcelas) {
            throw new BadRequestException('Dados do cartão inválidos');
          }
          resultadoPagamento =
            await this.pagamentosService.pagarComCartao(
              total,
              pagamentoDto.parcelas,
              pagamentoDto.numeroCartao,
            );
          break;

        case 'pix':
          resultadoPagamento =
            await this.pagamentosService.pagarComPix(total);
          break;

        case 'boleto':
          resultadoPagamento =
            await this.pagamentosService.pagarComBoleto(total);
          break;

        default:
          throw new BadRequestException('Método inválido');
      }

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
        pedido: pedidoSalvo,
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

      await itemCarrinhoRepo.delete(carrinho.itens.map(i => i.id));

      carrinho.itens = [];
      carrinho.total = 0;
      await carrinhoRepo.save(carrinho);

      await queryRunner.commitTransaction();

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
