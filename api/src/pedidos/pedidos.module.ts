import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from '../entity/pedido.entity';
import { Usuario } from '../entity/usuario.entity';
import { Produto } from '../entity/produto.entity';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, Usuario, Produto])],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
