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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { use } from 'passport';

@Controller('carrinho')
export class CarrinhoController {
  constructor(
    private readonly carrinhoService: CarrinhoService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
  @Get(':usuarioId')
  async verCarrinho(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.carrinhoService.obterCarrinho(usuarioId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
  @Delete(':usuarioId/limpar')
  async limparCarrinho(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.carrinhoService.limparCarrinho(usuarioId);
  }
}
