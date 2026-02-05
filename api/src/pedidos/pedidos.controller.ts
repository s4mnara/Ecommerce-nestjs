import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { ProcessarPagamentoDto } from '../pagamento/dto/processar-pagamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
  @Post(':usuarioId')
    criarPedido(
      @Param('usuarioId', ParseIntPipe) usuarioId: number,
      @Body() pagamentoDto: ProcessarPagamentoDto,
    ) {
      return this.pedidosService.criarPedidoAPartirDoCarrinho(
        usuarioId,
        pagamentoDto,
      );
    }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'admin')
  @Get('usuario/:usuarioId')
  findByUsuarioId(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.pedidosService.findByUsuarioId(usuarioId);
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'admin')
  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'admin')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.findOne(id);
  }

  // Atualiza status manualmente (ex: finalizar pedido pendente)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'admin')
  @Put(':id/finalizar')
  finalizarPedido(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.atualizarStatusPedido(id, 'finalizado');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'admin')
  @Post('checkout/:usuarioId')
  checkout(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() dto: ProcessarPagamentoDto,
  ) {
    return this.pedidosService.criarPedidoAPartirDoCarrinho(usuarioId, dto);
  }
}
