import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CACHE_MANAGER, CacheTTL } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CarrinhoService } from './carrinho.service';

@Controller('carrinho')
export class CarrinhoController {
  constructor(
    private readonly carrinhoService: CarrinhoService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get(':usuarioId')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  async verCarrinho(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    const cacheKey = `carrinho_${usuarioId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const carrinho = await this.carrinhoService.obterCarrinho(usuarioId);
    await this.cacheManager.set(cacheKey, carrinho, 30);
    console.log(`Cache set: ${cacheKey}`);
    return carrinho;
  }

  @Post(':usuarioId/adicionar')
  async adicionarProduto(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() { produtoId, quantidade }: { produtoId: number; quantidade: number },
  ) {
    const resultado = await this.carrinhoService.adicionarProduto(usuarioId, produtoId, quantidade);
    await this.cacheManager.del(`carrinho_${usuarioId}`);
    console.log(`Cache removido: carrinho_${usuarioId} (após adicionar)`);
    return resultado;
  }

  @Put(':usuarioId/atualizar/:produtoId')
  async atualizarQuantidade(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('produtoId', ParseIntPipe) produtoId: number,
    @Body('quantidade', ParseIntPipe) quantidade: number,
  ) {
    const resultado = await this.carrinhoService.atualizarQuantidade(usuarioId, produtoId, quantidade);
    await this.cacheManager.del(`carrinho_${usuarioId}`);
    console.log(`Cache removido: carrinho_${usuarioId} (após atualizar)`);
    return resultado;
  }

  @Delete(':usuarioId/remover/:produtoId')
  async removerProduto(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('produtoId', ParseIntPipe) produtoId: number,
  ) {
    const resultado = await this.carrinhoService.removerProduto(usuarioId, produtoId);
    await this.cacheManager.del(`carrinho_${usuarioId}`);
    console.log(`Cache removido: carrinho_${usuarioId} (após remover)`);
    return resultado;
  }

  @Delete(':usuarioId/limpar')
  async limparCarrinho(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    const resultado = await this.carrinhoService.limparCarrinho(usuarioId);
    await this.cacheManager.del(`carrinho_${usuarioId}`);
    console.log(`Cache removido: carrinho_${usuarioId} (após limpar)`);
    return resultado;
  }
}

