import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrinho } from '../entity/carrinho.entity';
import { Usuario } from '../entity/usuario.entity';
import { Produto } from '../entity/produto.entity';

@Injectable()
export class CarrinhosService {
  constructor(
    @InjectRepository(Carrinho)
    private readonly carrinhoRepository: Repository<Carrinho>,
  ) {}

  async findAll(): Promise<Carrinho[]> {
    return this.carrinhoRepository.find({ relations: ['usuario', 'produtos'] });
  }

  async findOne(id: number): Promise<Carrinho> {
    const carrinho = await this.carrinhoRepository.findOne({
      where: { id },
      relations: ['usuario', 'produtos'],
    });
    if (!carrinho) {
      throw new NotFoundException(`Carrinho com ID ${id} não encontrado`);
    }
    return carrinho;
  }

  async create(data: Partial<Carrinho>): Promise<Carrinho> {
    const carrinho = this.carrinhoRepository.create(data);
    return this.carrinhoRepository.save(carrinho);
  }

  async update(id: number, data: Partial<Carrinho>): Promise<Carrinho> {
    const carrinho = await this.findOne(id);
    Object.assign(carrinho, data);
    return this.carrinhoRepository.save(carrinho);
  }

  async remove(id: number): Promise<void> {
    const carrinho = await this.findOne(id);
    await this.carrinhoRepository.remove(carrinho);
  }
}

