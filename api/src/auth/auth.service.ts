import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../entity/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LogsService } from '../logs-usuario/logs.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly logsService: LogsService, // injetado
  ) {}

  async validateUser(email: string, senha: string): Promise<Usuario> {
    const usuario = await this.usuariosService.findByEmailWithPassword(email);

    if (!usuario) throw new UnauthorizedException('Usuário não encontrado');

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) throw new UnauthorizedException('Senha incorreta');

    const { senha: _, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha as Usuario;
  }

  async login(usuario: Usuario) {
    const payload = { sub: usuario.id, email: usuario.email, role: usuario.role };
    const token = this.jwtService.sign(payload);

    await this.logsService.registrarLog({
      usuarioId: usuario.id,
      acao: 'Login do usuário',
      detalhes: { email: usuario.email },
    });

    return {
      access_token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    };
  }

  async register(nome: string, email: string, senha: string) {
    const existente = await this.usuariosService.findByEmailWithPassword(email);
    if (existente) throw new ConflictException('Email já cadastrado');

    const hashSenha = await bcrypt.hash(senha, 10);

    const usuario = await this.usuariosService.create({
      nome,
      email,
      senha: hashSenha,
      role: 'cliente',
    });

    await this.logsService.registrarLog({
      usuarioId: usuario.id,
      acao: 'Registro de usuário',
      detalhes: { email },
    });

    return usuario;
  }
}
