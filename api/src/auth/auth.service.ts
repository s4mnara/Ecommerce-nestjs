import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LogsService } from '../logs-usuario/logs.service';
import { RegisterDto } from './dto/register.dto';
import { ViaCepService } from '../endereco/viacep.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly logsService: LogsService,
    private readonly viaCepService: ViaCepService,
  ) {}

  async validateUser(email: string, senha: string) {
    const usuario =
      await this.usuariosService.findByEmailWithPassword(email);

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const { senha: _, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha;
  }

  async login(usuario: any) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };

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
        nomeCompleto: usuario.nomeCompleto,
        email: usuario.email,
        role: usuario.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existente =
      await this.usuariosService.findByEmailWithPassword(dto.email);

    if (existente) {
      throw new ConflictException('Email já cadastrado');
    }

    const enderecoViaCep =
      await this.viaCepService.buscarEndereco(dto.cep);

    const hashSenha = await bcrypt.hash(dto.senha, 10);

    const cpfNormalizado = dto.cpf
  ? dto.cpf.replace(/\D/g, '')
  : undefined;

    const usuario = await this.usuariosService.create({
      nome: dto.nome,
      email: dto.email,
      senha: hashSenha,
      telefone: dto.telefone,
      cpf: cpfNormalizado,
      dataNascimento: dto.dataNascimento,
      role: 'cliente',
      endereco: {
        ...enderecoViaCep,
        numero: dto.numero,
        complemento: dto.complemento,
      },
    });


    await this.logsService.registrarLog({
      usuarioId: usuario.id,
      acao: 'Registro de usuário',
      detalhes: { email: dto.email },
    });

    return usuario;
  }
}
