import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { CarrinhosService } from './carrinho.service';
import { Carrinho } from '../entity/carrinho.entity';

@Controller('carrinhos')
export class CarrinhosController {
  constructor(private readonly carrinhosService: CarrinhosService) {}

  @Post()
  create(@Body() carrinho: Carrinho) {
    return this.carrinhosService.create(carrinho);
  }

  @Get()
  findAll() {
    return this.carrinhosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.carrinhosService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() carrinho: Carrinho) {
    return this.carrinhosService.update(id, carrinho);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.carrinhosService.remove(id);
  }
}
