// src/pagamentos/pagamentos.controller.ts
import { Controller, Post, Param, Get, ParseIntPipe } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';

@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentosService: PagamentosService) {}

  /**
   * Inicia o pagamento falso e retorna o resumo do pedido
   * @param usuarioId
   */
  @Post('iniciar/:usuarioId')
  async iniciar(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    const result = await this.pagamentosService.processarPagamentoFalso(usuarioId);
    return result;
  }

  /**
   * Retorna resumo do pedido
   * @param orderId
   */
  @Get('sucesso/:orderId')
  async sucesso(@Param('orderId', ParseIntPipe) orderId: number) {
    const resumo = await this.pagamentosService.obterResumoPedido(orderId);
    return resumo;
  }
}
