import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrinho } from '../entity/carrinho.entity';
import { Usuario } from '../entity/usuario.entity';
import { Produto } from '../entity/produto.entity';
import { CarrinhosService } from './carrinho.service';
import { CarrinhosController } from './carrinho.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Carrinho, Usuario, Produto])],
  controllers: [CarrinhosController],
  providers: [CarrinhosService],
})
export class CarrinhoModule {}

