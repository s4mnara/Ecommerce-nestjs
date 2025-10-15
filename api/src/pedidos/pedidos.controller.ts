import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { Pedido } from '../entity/pedido.entity';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  create(@Body() pedido: Pedido) {
    return this.pedidosService.create(pedido);
  }

  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.pedidosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() pedido: Pedido) {
    return this.pedidosService.update(id, pedido);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.pedidosService.remove(id);
  }
}
