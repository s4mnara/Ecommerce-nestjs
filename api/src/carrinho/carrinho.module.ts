import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrinho } from '../entity/carrinho.entity';
import { Usuario } from '../entity/usuario.entity';
import { Produto } from '../entity/produto.entity';
import { CarrinhoService } from './carrinho.service';
import { CarrinhoController } from './carrinho.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Carrinho, Usuario, Produto])],
  controllers: [CarrinhoController],
  providers: [CarrinhoService],
})
export class CarrinhoModule {}

