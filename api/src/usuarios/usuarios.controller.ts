import { Controller, Get, Post, Body, Param, Delete, Put, NotFoundException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Usuario } from '../entity/usuario.entity';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() usuario: Partial<Usuario>) {
    return this.usuariosService.create(usuario);
  }

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usuariosService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() usuario: Partial<Usuario>) {
    const atualizado = await this.usuariosService.update(id, usuario);
    if (!atualizado) {
      throw new NotFoundException('Usuário não encontrado ou nenhum campo para atualizar');
    }
    return atualizado;
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usuariosService.remove(id);
  }
}
