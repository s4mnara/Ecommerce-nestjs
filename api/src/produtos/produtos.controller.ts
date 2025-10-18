import { Controller, Get, Post, Body, Param, Delete, Put, NotFoundException, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { Produto } from '../entity/produto.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() produto: Partial<Produto>) {
    return this.produtosService.create(produto);
  }

  @Get()
  findAll() {
    return this.produtosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() produto: Partial<Produto>) {
    const atualizado = await this.produtosService.update(id, produto);
    if (!atualizado) {
      throw new NotFoundException('Produto não encontrado ou nenhum campo para atualizar');
    }
    return atualizado;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.remove(id);
  }
}