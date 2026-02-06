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
import { EmailService } from '../mail/mail.service';
import { ConfirmarEmailDto } from './dto/confirmar-email.dto';
import { ReenviarCodigoDto } from './dto/reenviar-codigo.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly logsService: LogsService,
    private readonly viaCepService: ViaCepService,
    private readonly emailService: EmailService,
  ) {}

async validateUser(email: string, senha: string) {
  const usuario =
    await this.usuariosService.findByEmailWithPassword(email);

  if (!usuario) {
    throw new UnauthorizedException('Usuário não encontrado');
  }

  if (
    usuario.bloqueadoAte &&
    usuario.bloqueadoAte > new Date()
  ) {
    throw new UnauthorizedException(
      'Conta bloqueada por excesso de tentativas. Tente mais tarde.',
    );
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    await this.usuariosService.incrementarTentativa(usuario.id);

    const tentativas = usuario.tentativasLogin + 1;


    if (tentativas >= 5) {
      await this.usuariosService.bloquearUsuario(usuario.id, 15);

      await this.logsService.registrarLog({
        usuarioId: usuario.id,
        acao: 'Usuário bloqueado por tentativas de login',
        detalhes: { email },
      });

      throw new UnauthorizedException(
        'Conta bloqueada após 5 tentativas inválidas',
      );
    }

    throw new UnauthorizedException(
      `Senha incorreta. Tentativa ${tentativas}/5`,
    );
  }
  if (!usuario.emailVerificado) {
  throw new UnauthorizedException(
    'Email não confirmado. Verifique sua caixa de entrada.',
  );
}
  await this.usuariosService.resetarTentativas(usuario.id);

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

  // 🔐 gera código
  const codigo = this.gerarCodigoVerificacao();
  const expiraEm = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  const usuario = await this.usuariosService.create({
    nome: dto.nome,
    email: dto.email,
    senha: hashSenha,
    telefone: dto.telefone,
    cpf: cpfNormalizado,
    dataNascimento: dto.dataNascimento,
    role: 'cliente',
    emailVerificado: false,
    codigoVerificacaoEmail: codigo,
    codigoExpiraEm: expiraEm,
    endereco: {
      ...enderecoViaCep,
      numero: dto.numero,
      complemento: dto.complemento,
    },
  });

  // 📧 envia email
  await this.emailService.enviarEmailSimples(
    usuario.email,
    'Confirmação de cadastro',
    `Seu código de verificação é: ${codigo}\n\nEste código expira em 15 minutos.`,
  );

  await this.logsService.registrarLog({
    usuarioId: usuario.id,
    acao: 'Registro de usuário',
    detalhes: { email: dto.email },
  });

  return {
    message: 'Usuário cadastrado. Verifique seu email para confirmar.',
  };
}

async confirmarEmail(dto: ConfirmarEmailDto) {
  const usuario = await this.usuariosService.findByEmail(dto.email);

  if (!usuario) {
    throw new UnauthorizedException('Usuário não encontrado');
  }

  if (usuario.emailVerificado) {
    return { message: 'Email já confirmado' };
  }

  if (
    !usuario.codigoVerificacaoEmail ||
    usuario.codigoVerificacaoEmail !== dto.codigo
  ) {
    throw new UnauthorizedException('Código inválido');
  }

  if (usuario.codigoExpiraEm < new Date()) {
    throw new UnauthorizedException('Código expirado');
  }

  await this.usuariosService.atualizar(usuario.id, {
    emailVerificado: true,
    codigoVerificacaoEmail: undefined,
    codigoExpiraEm: undefined,
  });

  await this.logsService.registrarLog({
    usuarioId: usuario.id,
    acao: 'Email confirmado',
    detalhes: { email: usuario.email },
  });

  return { message: 'Email confirmado com sucesso' };
}


  private gerarCodigoVerificacao(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async reenviarCodigo(dto: ReenviarCodigoDto) {
  const usuario = await this.usuariosService.findByEmail(dto.email);

  // segurança: não revelar se existe ou não
  if (!usuario) {
    return {
      message:
        'Se o email estiver cadastrado, um novo código será enviado.',
    };
  }

  if (usuario.emailVerificado) {
    return {
      message: 'Email já confirmado.',
    };
  }

  const codigo = this.gerarCodigoVerificacao();
  const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

  await this.usuariosService.atualizar(usuario.id, {
    codigoVerificacaoEmail: codigo,
    codigoExpiraEm: expiraEm,
  });

  await this.emailService.enviarEmailSimples(
    usuario.email,
    'Novo código de confirmação',
    `Seu novo código de verificação é: ${codigo}\n\nEste código expira em 15 minutos.`,
  );

  await this.logsService.registrarLog({
    usuarioId: usuario.id,
    acao: 'Reenvio de código de confirmação',
    detalhes: { email: usuario.email },
  });

  return {
    message:
      'Se o email estiver cadastrado, um novo código será enviado.',
  };
}

}
