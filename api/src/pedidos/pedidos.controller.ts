import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { Pedido } from '../entity/pedido.entity';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  // Criar pedido a partir do carrinho do usuário
  @Post('usuario/:usuarioId')
  criarPedido(@Param('usuarioId') usuarioId: number) {
    return this.pedidosService.criarPedido(usuarioId);
  }

  // Listar todos os pedidos
  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  // Buscar pedido por ID
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.pedidosService.findOne(id);
  }

  // Atualizar pedido (ex.: alterar status)
  @Put(':id')
  update(@Param('id') id: number, @Body() pedido: Partial<Pedido>) {
    return this.pedidosService.update(id, pedido);
  }

  // Remover pedido
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.pedidosService.remove(id);
  }
}
