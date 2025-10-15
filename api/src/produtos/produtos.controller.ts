import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { Produto } from '../entity/produto.entity';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Post()
  create(@Body() produto: Produto) {
    return this.produtosService.create(produto);
  }

  @Get()
  findAll() {
    return this.produtosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.produtosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() produto: Produto) {
    return this.produtosService.update(id, produto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.produtosService.remove(id);
  }
}
