import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';

import { Produto } from '../entity/produto.entity';

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  private readonly TTL = 60; // segundos

  // ========================
  // BUSCAR TODOS (CACHE)
  // ========================
  async findAll(): Promise<Produto[]> {
    const cacheKey = 'produtos:all';

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('Redis HIT:', cacheKey);
      return JSON.parse(cached);
    }

    console.log('Redis MISS:', cacheKey);
    const produtos = await this.produtoRepository.find();

    await this.redis.set(
      cacheKey,
      JSON.stringify(produtos),
      'EX',
      this.TTL,
    );

    return produtos;
  }

  // ========================
  // BUSCAR UM (CACHE)
  // ========================
  async findOne(id: number): Promise<Produto> {
    const cacheKey = `produtos:${id}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('Redis HIT:', cacheKey);
      return JSON.parse(cached);
    }

    console.log('Redis MISS:', cacheKey);
    const produto = await this.produtoRepository.findOneBy({ id });

    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }

    await this.redis.set(
      cacheKey,
      JSON.stringify(produto),
      'EX',
      this.TTL,
    );

    return produto;
  }

  // ========================
  // CRIAR (INVALIDA CACHE)
  // ========================
  async create(data: Partial<Produto>): Promise<Produto> {
    const produto = this.produtoRepository.create({
      ...data,
      descricao: data.descricao || 'Sem descrição informada',
      estoque: data.estoque ?? 0,
    });

    const salvo = await this.produtoRepository.save(produto);

    await this.redis.del('produtos:all');
    console.log('Redis DEL: produtos:all');

    return salvo;
  }

  // ========================
  // ATUALIZAR (INVALIDA CACHE)
  // ========================
  async update(id: number, data: Partial<Produto>): Promise<Produto> {
    const produto = await this.findOne(id);

    const campos = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );

    Object.assign(produto, campos);

    const atualizado = await this.produtoRepository.save(produto);

    await this.redis.del('produtos:all');
    await this.redis.del(`produtos:${id}`);
    console.log(`Redis DEL: produtos:all, produtos:${id}`);

    return atualizado;
  }

  // ========================
  // REMOVER (INVALIDA CACHE)
  // ========================
  async remove(id: number): Promise<void> {
    await this.produtoRepository.delete(id);

    await this.redis.del('produtos:all');
    await this.redis.del(`produtos:${id}`);
    console.log(`Redis DEL: produtos:all, produtos:${id}`);
  }
}
