import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';

import { Carrinho } from '../entity/carrinho.entity';
import { Produto } from '../entity/produto.entity';
import { Usuario } from '../entity/usuario.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { LogsService } from '../logs-usuario/logs.service';

@Injectable()
export class CarrinhoService {
  constructor(
    @InjectRepository(Carrinho)
    private readonly carrinhoRepository: Repository<Carrinho>,

    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(ItemCarrinho)
    private readonly itemCarrinhoRepository: Repository<ItemCarrinho>,

    private readonly logsService: LogsService,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  private readonly TTL = 120; // segundos

  private carrinhoKey(usuarioId: number) {
    return `carrinho:${usuarioId}`;
  }

  // ========================
  // ADICIONAR PRODUTO
  // ========================
  async adicionarProduto(
    usuarioId: number,
    produtoId: number,
    quantidade: number,
  ) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');

    const produto = await this.produtoRepository.findOne({
      where: { id: produtoId },
    });
    if (!produto) throw new NotFoundException('Produto não encontrado.');

    let carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });

    if (!carrinho) {
      carrinho = this.carrinhoRepository.create({
        usuario,
        itens: [],
        total: 0,
      });
      carrinho = await this.carrinhoRepository.save(carrinho);
    }

    let item = carrinho.itens.find(
      i => i.produto.id === produto.id,
    );

    if (item) {
      item.quantidade += quantidade;
      item.subtotal = item.quantidade * produto.preco;
      await this.itemCarrinhoRepository.save(item);
    } else {
      const novoItem = this.itemCarrinhoRepository.create({
        carrinho,
        produto,
        quantidade,
        subtotal: produto.preco * quantidade,
      });
      await this.itemCarrinhoRepository.save(novoItem);
      carrinho.itens.push(novoItem);
    }

    carrinho.total = carrinho.itens.reduce(
      (acc, i) => acc + i.subtotal,
      0,
    );
    await this.carrinhoRepository.save(carrinho);

    await this.redis.del(this.carrinhoKey(usuarioId));

    await this.logsService.registrarLog({
      usuarioId,
      acao: 'Adicionar produto ao carrinho',
      detalhes: { produtoId, quantidade },
    });

    return this.obterCarrinho(usuarioId);
  }

  // ========================
  // ATUALIZAR QUANTIDADE
  // ========================
  async atualizarQuantidade(
    usuarioId: number,
    produtoId: number,
    novaQuantidade: number,
  ) {
    if (novaQuantidade <= 0) {
      return this.removerProduto(usuarioId, produtoId);
    }

    const carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });
    if (!carrinho) throw new NotFoundException('Carrinho não encontrado.');

    const item = carrinho.itens.find(
      i => i.produto.id === produtoId,
    );
    if (!item) throw new NotFoundException('Produto não está no carrinho.');

    item.quantidade = novaQuantidade;
    item.subtotal = item.quantidade * item.produto.preco;
    await this.itemCarrinhoRepository.save(item);

    carrinho.total = carrinho.itens.reduce(
      (acc, i) => acc + i.subtotal,
      0,
    );
    await this.carrinhoRepository.save(carrinho);

    await this.redis.del(this.carrinhoKey(usuarioId));

    await this.logsService.registrarLog({
      usuarioId,
      acao: 'Atualizar quantidade do produto no carrinho',
      detalhes: { produtoId, novaQuantidade },
    });

    return this.obterCarrinho(usuarioId);
  }

  // ========================
  // REMOVER PRODUTO
  // ========================
  async removerProduto(usuarioId: number, produtoId: number) {
    const carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });
    if (!carrinho) throw new NotFoundException('Carrinho não encontrado.');

    const item = carrinho.itens.find(
      i => i.produto.id === produtoId,
    );
    if (!item) throw new NotFoundException('Produto não está no carrinho.');

    await this.itemCarrinhoRepository.remove(item);

    carrinho.itens = carrinho.itens.filter(
      i => i.id !== item.id,
    );
    carrinho.total = carrinho.itens.reduce(
      (acc, i) => acc + i.subtotal,
      0,
    );
    await this.carrinhoRepository.save(carrinho);

    await this.redis.del(this.carrinhoKey(usuarioId));

    await this.logsService.registrarLog({
      usuarioId,
      acao: 'Remover produto do carrinho',
      detalhes: { produtoId },
    });

    return this.obterCarrinho(usuarioId);
  }

  // ========================
  // LIMPAR CARRINHO
  // ========================
  async limparCarrinho(usuarioId: number) {
    const carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'usuario'],
    });
    if (!carrinho) throw new NotFoundException('Carrinho não encontrado.');

    await this.itemCarrinhoRepository.remove(carrinho.itens);

    carrinho.itens = [];
    carrinho.total = 0;
    await this.carrinhoRepository.save(carrinho);

    await this.redis.del(this.carrinhoKey(usuarioId));

    await this.logsService.registrarLog({
      usuarioId,
      acao: 'Limpar carrinho',
    });

    return { message: 'Carrinho limpo com sucesso.' };
  }

  // ========================
  // OBTER CARRINHO (CACHE)
  // ========================
  async obterCarrinho(usuarioId: number) {
    const cacheKey = this.carrinhoKey(usuarioId);

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('Redis HIT:', cacheKey);
      return JSON.parse(cached);
    }

    console.log('Redis MISS:', cacheKey);

    let carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });

    if (!carrinho) {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
      });
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');

      carrinho = this.carrinhoRepository.create({
        usuario,
        itens: [],
        total: 0,
      });
      carrinho = await this.carrinhoRepository.save(carrinho);
    }

    const itens = carrinho.itens.map(item => ({
      id: item.produto.id,
      nome: item.produto.nome,
      preco: Number(item.produto.preco),
      quantidade: item.quantidade,
      itemId: item.id,
    }));

    const total = itens.reduce(
      (acc, i) => acc + i.preco * i.quantidade,
      0,
    );

    const response = {
      id: carrinho.id,
      usuarioId,
      itens,
      total: total.toFixed(2),
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(response),
      'EX',
      this.TTL,
    );

    return response;
  }
}
