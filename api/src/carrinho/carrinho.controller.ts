import { Controller, Post, Delete, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { CarrinhoService } from './carrinho.service';

@Controller('carrinho')
export class CarrinhoController {
  constructor(private readonly carrinhoService: CarrinhoService) {}

  @Get(':usuarioId')
  verCarrinho(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.carrinhoService.verCarrinho(usuarioId);
  }

  @Post(':usuarioId/adicionar')
  adicionarProduto(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() { produtoId, quantidade }: { produtoId: number; quantidade: number },
  ) {
    return this.carrinhoService.adicionarProduto(usuarioId, produtoId, quantidade);
  }

  @Delete(':usuarioId/remover/:produtoId')
  removerProduto(
    @Param('usuarioId', ParseIntPipe) usuarioId: number, 
    @Param('produtoId', ParseIntPipe) produtoId: number
  ) {
    return this.carrinhoService.removerProduto(usuarioId, produtoId);
  }

  @Delete(':usuarioId/limpar')
  limparCarrinho(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.carrinhoService.limparCarrinho(usuarioId);
  }
}