import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '../entity/produto.entity';

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
  ) {}

  async findAll(): Promise<Produto[]> {
    return this.produtoRepository.find();
  }

  async findOne(id: number): Promise<Produto> {
    const produto = await this.produtoRepository.findOneBy({ id });
    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }
    return produto;
  }

  async create(data: Partial<Produto>): Promise<Produto> {
    const produtoComDefaults = this.produtoRepository.create({
      ...data,
      descricao: data.descricao || 'Sem descrição informada',
      estoque: data.estoque !== undefined ? data.estoque : 0,
    });
    return this.produtoRepository.save(produtoComDefaults);
  }

  async update(id: number, data: Partial<Produto>): Promise<Produto> {
    const produto = await this.findOne(id);
    const campos = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    if (Object.keys(campos).length === 0) return produto;
    Object.assign(produto, campos);
    return this.produtoRepository.save(produto);
  }

  async remove(id: number): Promise<void> {
    const produto = await this.findOne(id);
    await this.produtoRepository.remove(produto);
  }
}
