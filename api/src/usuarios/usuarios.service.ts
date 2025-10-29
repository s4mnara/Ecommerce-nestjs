import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entity/usuario.entity';
import { KafkaProducer } from '../kafka/kafka.producer';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarioRepository: Repository<Usuario>,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  async create(usuario: Partial<Usuario>): Promise<Usuario> {
    const novoUsuario = this.usuarioRepository.create(usuario);
    const usuarioSalvo = await this.usuarioRepository.save(novoUsuario);

    // Emite evento via KafkaProducer
    await this.kafkaProducer.emit('usuario.cadastrado', {
      usuarioId: usuarioSalvo.id,
      nome: usuarioSalvo.nome,
    });

    return usuarioSalvo;
  }

  async findByEmailWithPassword(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { email },
      select: ['id', 'nome', 'email', 'senha', 'role', 'telegramChatId'],
    });
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find();
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    return usuario;
  }

  async update(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    const existente = await this.findOne(id);
    Object.assign(existente, usuario);
    return this.usuarioRepository.save(existente);
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
  }
}


