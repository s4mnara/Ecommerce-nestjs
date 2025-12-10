import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { Pedido, StatusPedido } from '../entity/pedido.entity';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post(':usuarioId')
  criarPedido(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.pedidosService.criarPedidoAPartirDoCarrinho(usuarioId);
  }

  @Get('usuario/:usuarioId')
  findByUsuarioId(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.pedidosService.findByUsuarioId(usuarioId);
  }

  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.findOne(id);
  }

  // Atualiza status manualmente (ex: finalizar pedido pendente)
  @Put(':id/finalizar')
  finalizarPedido(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.atualizarStatusPedido(id, 'finalizado');
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.remove(id);
  }
}
