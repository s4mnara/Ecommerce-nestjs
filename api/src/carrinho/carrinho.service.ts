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
  if (!quantidade || quantidade <= 0) quantidade = 1;

  const usuario = await this.usuarioRepository.findOne({
    where: { id: usuarioId },
  });
  if (!usuario) throw new NotFoundException('Usuário não encontrado.');

  const produto = await this.produtoRepository.findOne({
    where: { id: produtoId },
  });
  if (!produto) throw new NotFoundException('Produto não encontrado.');

  const preco = Number(produto.preco);

  let carrinho = await this.carrinhoRepository.findOne({
    where: { usuario: { id: usuarioId } },
    relations: ['itens', 'itens.produto', 'usuario'],
  });

  if (!carrinho) {
    carrinho = await this.carrinhoRepository.save(
      this.carrinhoRepository.create({
        usuario,
        itens: [],
        total: 0,
      }),
    );
  }

  let item = carrinho.itens.find(i => i.produto.id === produto.id);

  if (item) {
    item.quantidade += quantidade;
    item.subtotal = item.quantidade * preco;
    await this.itemCarrinhoRepository.save(item);
  } else {
    const novoItem = this.itemCarrinhoRepository.create({
      carrinho,
      produto,
      quantidade,
      subtotal: preco * quantidade,
    });
    await this.itemCarrinhoRepository.save(novoItem);
    carrinho.itens.push(novoItem);
  }

  carrinho.total = carrinho.itens.reduce(
    (acc, i) => acc + Number(i.subtotal),
    0,
  );

  await this.carrinhoRepository.save(carrinho);
  await this.limparCache(usuarioId);

  return this.obterCarrinho(usuarioId);
}

private async limparCache(usuarioId: number) {
  if (this.redis) {
    await this.redis.del(this.carrinhoKey(usuarioId));
  }
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
      relations:  ['itens', 'itens.produto', 'usuario'],
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

    // Limpar cache
    await this.limparCache(usuarioId);

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
      where: { usuario:  { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });
    if (!carrinho) throw new NotFoundException('Carrinho não encontrado.');

    const item = carrinho.itens.find(
      i => i.produto.id === produtoId,
    );
    if (!item) throw new NotFoundException('Produto não está no carrinho.');

    await this.itemCarrinhoRepository. remove(item);

    carrinho.itens = carrinho.itens. filter(
      i => i. id !== item.id,
    );
    carrinho.total = carrinho.itens.reduce(
      (acc, i) => acc + i.subtotal,
      0,
    );
    await this.carrinhoRepository.save(carrinho);

    // Limpar cache
    await this.limparCache(usuarioId);

    await this.logsService. registrarLog({
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

    await this.itemCarrinhoRepository. remove(carrinho.itens);

    carrinho.itens = [];
    carrinho.total = 0;
    await this. carrinhoRepository.save(carrinho);

    // Limpar cache
    await this.redis. del(this.carrinhoKey(usuarioId));

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

    // Tentar buscar do cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('✅ Redis HIT:', cacheKey);
      return JSON.parse(cached);
    }

    console.log('⚠️ Redis MISS:', cacheKey);

    // Buscar do banco
    let carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id:  usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });

    // Se não existe carrinho, criar um vazio
    if (!carrinho) {
      const usuario = await this.usuarioRepository. findOne({
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

    // ✅ CORREÇÃO: Estrutura de dados correta
    const itens = carrinho.itens. map(item => ({
      id: item.produto.id,              // ID do produto (para chave única no React)
      itemId: item.id,                  // ID do item no carrinho (para operações)
      produtoId: item.produto.id,       // ID do produto (explícito)
      nome: item.produto.nome,
      descricao: item.produto.descricao || '',
      preco: Number(item.produto.preco),
      quantidade: item.quantidade,
      subtotal: Number(item.subtotal),
      imagem: item.produto.imagem || null,  // ✅ Incluir imagem
    }));

    // Calcular total
    const total = itens.reduce(
      (acc, i) => acc + i.subtotal,
      0,
    );

    const response = {
      id: carrinho.id,
      usuarioId,
      itens,
      total:  Number(total. toFixed(2)),   // ✅ Retornar como número
    };

    // Salvar no cache
    await this.redis. set(
      cacheKey,
      JSON.stringify(response),
      'EX',
      this.TTL,
    );

    console.log('💾 Cache atualizado:', cacheKey);

    return response;
  }
}
