import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Put, 
  NotFoundException, 
  UseGuards
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Usuario } from '../entity/usuario.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  
  @Post()
  async create(@Body() usuario: Partial<Usuario>): Promise<Usuario> {
    if (!usuario.role) usuario.role = 'cliente'; // define role cliente por padrão
    return await this.usuariosService.create(usuario); // chama o service
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usuariosService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async update(@Param('id') id: number, @Body() usuario: Partial<Usuario>) {
    const atualizado = await this.usuariosService.update(id, usuario);
    if (!atualizado) {
      throw new NotFoundException('Usuário não encontrado ou nenhum campo para atualizar');
    }
    return atualizado;
  }
  @UseGuards(JwtAuthGuard, RolesGuard)  
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usuariosService.remove(id);
  }
}
