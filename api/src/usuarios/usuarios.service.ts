import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entity/usuario.entity';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly telegramService: TelegramService,
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

  // MÉTODO NECESSÁRIO PARA O JWT AUTH SERVICE
  async findByEmailWithPassword(email: string): Promise<Usuario | null> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email },
      select: ['id', 'nome', 'email', 'senha', 'role', 'telegramChatId'],
    });
    return usuario;
  }

  async create(usuario: Partial<Usuario>): Promise<Usuario> {
    const novoUsuario = this.usuarioRepository.create(usuario);
    const usuarioSalvo = await this.usuarioRepository.save(novoUsuario);

    if (usuarioSalvo.telegramChatId) {
      await this.telegramService.enviarMensagem(
        usuarioSalvo.telegramChatId,
        `Olá <b>${usuarioSalvo.nome}</b>, seu cadastro foi realizado com sucesso! :)`,
      );
    }

    return usuarioSalvo;
  }

  async update(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    const usuarioExistente = await this.findOne(id);
    const campos = Object.fromEntries(Object.entries(usuario).filter(([_, v]) => v !== undefined));
    if (Object.keys(campos).length === 0) return usuarioExistente;
    Object.assign(usuarioExistente, campos);
    return this.usuarioRepository.save(usuarioExistente);
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
  }
}
