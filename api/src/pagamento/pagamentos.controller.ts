// src/pagamentos/pagamentos.controller.ts
import { Controller, Post, Param, Get, ParseIntPipe } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';

@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentosService: PagamentosService) {}

  // Inicia o pagamento falso e retorna uma "url" para redirecionamento
  @Post('iniciar/:usuarioId')
  async iniciar(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    const result = await this.pagamentosService.processarPagamentoFalso(usuarioId);
    return result;
  }

  // Simula página de sucesso (opcional)
  @Get('sucesso/:orderId')
  async sucesso(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.pagamentosService.obterResumoPedido(orderId);
  }
}
