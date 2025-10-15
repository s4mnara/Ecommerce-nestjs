import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entity/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find();
  }

async findOne(id: number): Promise<Usuario> {
  const usuario = await this.usuarioRepository.findOneBy({ id });
  if (!usuario) {
    throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
  }
  return usuario;
}

  async create(usuario: Usuario): Promise<Usuario> {
    return this.usuarioRepository.save(usuario);
  }

  async update(id: number, usuario: Partial<Usuario>) {
    await this.usuarioRepository.update(id, usuario);
    return this.usuarioRepository.findOneBy({ id });
  }

  async remove(id: number) {
    return this.usuarioRepository.delete(id);
  }
}

