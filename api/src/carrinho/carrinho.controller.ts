import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { CarrinhoService } from './carrinho.service';

@Controller('carrinho')
export class CarrinhoController {
  constructor(
    private readonly carrinhoService: CarrinhoService,
  ) {}

  // ========================
  // VER CARRINHO
  // ========================
  @Get(':usuarioId')
  async verCarrinho(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.carrinhoService.obterCarrinho(usuarioId);
  }

  // ========================
  // ADICIONAR PRODUTO
  // ========================
  @Post(':usuarioId/adicionar')
  async adicionarProduto(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body()
    body: { produtoId: number; quantidade: number },
  ) {
    const { produtoId, quantidade } = body;
    return this.carrinhoService.adicionarProduto(
      usuarioId,
      produtoId,
      quantidade,
    );
  }

  // ========================
  // ATUALIZAR QUANTIDADE
  // ========================
  @Put(':usuarioId/atualizar/:produtoId')
  async atualizarQuantidade(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('produtoId', ParseIntPipe) produtoId: number,
    @Body('quantidade', ParseIntPipe) quantidade: number,
  ) {
    return this.carrinhoService.atualizarQuantidade(
      usuarioId,
      produtoId,
      quantidade,
    );
  }

  // ========================
  // REMOVER PRODUTO
  // ========================
  @Delete(':usuarioId/remover/:produtoId')
  async removerProduto(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('produtoId', ParseIntPipe) produtoId: number,
  ) {
    return this.carrinhoService.removerProduto(
      usuarioId,
      produtoId,
    );
  }

  // ========================
  // LIMPAR CARRINHO
  // ========================
  @Delete(':usuarioId/limpar')
  async limparCarrinho(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.carrinhoService.limparCarrinho(usuarioId);
  }
}
