import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entity/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(usuario: Partial<Usuario>): Promise<Usuario> {
    const novoUsuario = this.usuarioRepository.create(usuario);
    return this.usuarioRepository.save(novoUsuario);
  }

  async findByEmailWithPassword(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { email },
      select: ['id', 'nome', 'email', 'senha', 'role'],
    });
  }

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

  async update(id: number, dados: Partial<Usuario>): Promise<Usuario> {
    const usuario = await this.findOne(id);
    Object.assign(usuario, dados);
    return this.usuarioRepository.save(usuario);
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
  }

    async incrementarTentativa(usuarioId: number) {
    await this.usuarioRepository.increment(
      { id: usuarioId },
      'tentativasLogin',
      1,
    );
  }

  async bloquearUsuario(usuarioId: number, minutos = 15) {
    const bloqueio = new Date();
    bloqueio.setMinutes(bloqueio.getMinutes() + minutos);

    await this.usuarioRepository.update(usuarioId, {
      bloqueadoAte: bloqueio,
    });
  }

  async resetarTentativas(usuarioId: number) {
    await this.usuarioRepository.update(usuarioId, {
      tentativasLogin: 0,
      bloqueadoAte: null,
    });
  }

}
