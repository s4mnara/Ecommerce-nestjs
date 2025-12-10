import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from '../entity/pedido.entity';
import { ItemPedido } from '../entity/item-pedido.entity';
import { Usuario } from '../entity/usuario.entity';
import { Produto } from '../entity/produto.entity';
import { Carrinho } from '../entity/carrinho.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { CarrinhoModule } from '../carrinho/carrinho.module';
import { LogsModule } from 'src/logs-usuario/logs.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Usuario, Produto, Carrinho, ItemCarrinho, ItemPedido]),
    CarrinhoModule,
    LogsModule,
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}

