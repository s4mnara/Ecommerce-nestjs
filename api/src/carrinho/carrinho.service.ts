// src/carrinho/carrinho.service.ts
import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Carrinho } from '../entity/carrinho.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { Produto } from '../entity/produto.entity';
import { Usuario } from '../entity/usuario.entity';
import { ClientKafka } from '@nestjs/microservices';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class CarrinhoService {
  private readonly logger = new Logger(CarrinhoService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Carrinho)
    private readonly carrinhoRepo: Repository<Carrinho>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly telegramService: TelegramService,
  ) {}

  private async enviarTelegram(usuario: Usuario, mensagem: string) {
    if (!usuario || !usuario.telegramChatId) {
      this.logger.warn(
        `Usuário ${usuario?.id || 'desconhecido'} não possui telegramChatId definido. Mensagem não será enviada.`,
      );
      return;
    }
    await this.telegramService.enviarMensagem(usuario.telegramChatId.toString(), mensagem);
  }

  async verCarrinho(usuarioId: number): Promise<Carrinho> {
    const carrinho = await this.carrinhoRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });
    if (!carrinho) throw new NotFoundException('Carrinho não encontrado');
    return carrinho;
  }

  async adicionarProduto(usuarioId: number, produtoId: number, quantidade: number): Promise<Carrinho> {
    return this.dataSource.transaction(async manager => {
      const usuario = await manager.findOne(Usuario, { where: { id: usuarioId } });
      if (!usuario) throw new NotFoundException('Usuário não encontrado');

      const produto = await manager.findOne(Produto, { where: { id: produtoId } });
      if (!produto) throw new NotFoundException('Produto não encontrado');

      let carrinho = await manager.findOne(Carrinho, {
        where: { usuario: { id: usuarioId } },
        relations: ['itens', 'itens.produto'],
      });

      if (!carrinho) {
        carrinho = await manager.save(Carrinho, manager.create(Carrinho, { usuario, total: 0 }));
        carrinho.itens = [];
      }

      const precoProduto = Number(produto.preco);
      if (isNaN(precoProduto)) throw new Error('Preço do produto inválido');

      const itemExistente = carrinho.itens.find(i => i.produto.id === produtoId);

      if (itemExistente) {
        itemExistente.quantidade += quantidade;
        itemExistente.subtotal = itemExistente.quantidade * precoProduto;
        await manager.save(ItemCarrinho, itemExistente);
      } else {
        const novoItem = manager.create(ItemCarrinho, {
          carrinho,
          produto,
          quantidade,
          subtotal: quantidade * precoProduto,
        });
        await manager.save(ItemCarrinho, novoItem);
        carrinho.itens.push(novoItem);
      }

      carrinho.total = carrinho.itens.reduce((acc, i) => acc + Number(i.subtotal), 0);
      const salvo = await manager.save(Carrinho, carrinho);

      // Kafka emit seguro
      try {
        this.kafkaClient.emit('carrinho.produto.adicionado', {
          usuarioId,
          produtoId,
          quantidade,
          totalAtual: salvo.total,
        });
      } catch (err) {
        this.logger.error('Erro ao enviar evento Kafka adicionarProduto', err);
      }

      await this.enviarTelegram(
        usuario,
        `Produto <b>${produto.nome}</b> adicionado ao carrinho. Quantidade: ${quantidade}. Total atual: R$${salvo.total.toFixed(
          2,
        )}`,
      );

      return salvo;
    });
  }

  async removerProduto(usuarioId: number, produtoId: number): Promise<Carrinho> {
    return this.dataSource.transaction(async manager => {
      const carrinho = await manager.findOne(Carrinho, {
        where: { usuario: { id: usuarioId } },
        relations: ['itens', 'itens.produto', 'usuario'],
      });
      if (!carrinho) throw new NotFoundException('Carrinho não encontrado');

      const item = carrinho.itens.find(i => i.produto.id === produtoId);
      if (item) {
        await manager.delete(ItemCarrinho, { id: item.id });
        carrinho.itens = carrinho.itens.filter(i => i.produto.id !== produtoId);
      }

      carrinho.total = carrinho.itens.reduce((acc, i) => acc + Number(i.subtotal), 0);
      const salvo = await manager.save(Carrinho, carrinho);

      try {
        this.kafkaClient.emit('carrinho.produto.removido', {
          usuarioId,
          produtoId,
          totalAtual: salvo.total,
        });
      } catch (err) {
        this.logger.error('Erro ao enviar evento Kafka removerProduto', err);
      }

      await this.enviarTelegram(
        carrinho.usuario,
        `Produto removido do carrinho. Total atual: R$${salvo.total.toFixed(2)}`,
      );

      return salvo;
    });
  }

  async limparCarrinho(usuarioId: number): Promise<Carrinho> {
    return this.dataSource.transaction(async manager => {
      const carrinho = await manager.findOne(Carrinho, {
        where: { usuario: { id: usuarioId } },
        relations: ['itens', 'usuario'],
      });
      if (!carrinho) throw new NotFoundException('Carrinho não encontrado');

      if (carrinho.itens.length > 0) {
        await manager.delete(ItemCarrinho, { id: In(carrinho.itens.map(i => i.id)) });
      }

      carrinho.itens = [];
      carrinho.total = 0;
      const salvo = await manager.save(Carrinho, carrinho);

      try {
        this.kafkaClient.emit('carrinho.limpo', { usuarioId });
      } catch (err) {
        this.logger.error('Erro ao enviar evento Kafka limparCarrinho', err);
      }

      await this.enviarTelegram(
        carrinho.usuario,
        `Carrinho limpo com sucesso. Total atual: R$${salvo.total.toFixed(2)}`,
      );

      return salvo;
    });
  }
}
