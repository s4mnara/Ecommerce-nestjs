jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LogsService } from '../logs-usuario/logs.service';
import { ViaCepService } from '../endereco/viacep.service';
import { EmailService } from '../mail/mail.service';
import {
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  // ======================
  // 🔹 Mocks
  // ======================

  const mockUsuariosService = {
    findByEmailWithPassword: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    atualizar: jest.fn(),
    incrementarTentativa: jest.fn(),
    bloquearUsuario: jest.fn(),
    resetarTentativas: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake_jwt_token'),
  };

  const mockLogsService = {
    registrarLog: jest.fn(),
  };

  const mockEmailService = {
    enviarEmailSimples: jest.fn(),
  };

  const mockViaCepService = {
    buscarEndereco: jest.fn().mockResolvedValue({
      cep: '01001-000',
      rua: 'Rua Teste',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
    }),
  };

  beforeEach(async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: mockUsuariosService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: LogsService, useValue: mockLogsService },
        { provide: ViaCepService, useValue: mockViaCepService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // 🔐 validateUser
  // =====================================================

  it('should validate user with correct credentials', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      nomeCompleto: 'Admin',
      email: 'admin@test.com',
      senha: 'hashed',
      role: 'admin',
      tentativasLogin: 2,
      bloqueadoAte: null,
      emailVerificado: true,
    });

    const result = await service.validateUser(
      'admin@test.com',
      '123456',
    );

    expect(result).toHaveProperty('id');
    expect(result).not.toHaveProperty('senha');
    expect(mockUsuariosService.resetarTentativas).toHaveBeenCalledWith(1);
  });

  it('should throw UnauthorizedException if email is not verified', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      senha: 'hashed',
      emailVerificado: false,
    });

    await expect(
      service.validateUser('test@test.com', '123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user not found', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      service.validateUser('notfound@test.com', '123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should block user after 5 invalid login attempts', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'lock@test.com',
      senha: 'hashed',
      tentativasLogin: 4,
      bloqueadoAte: null,
      emailVerificado: true,
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.validateUser('lock@test.com', 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockUsuariosService.bloquearUsuario).toHaveBeenCalledWith(1, 15);
    expect(mockLogsService.registrarLog).toHaveBeenCalled();
  });

  // =====================================================
  // 🔑 login
  // =====================================================

  it('should return access_token and user data on login', async () => {
    const usuario = {
      id: 1,
      nomeCompleto: 'Samara',
      email: 'samara@test.com',
      role: 'admin',
    };

    const result = await service.login(usuario as any);

    expect(result).toHaveProperty('access_token');
    expect(result.usuario.email).toBe('samara@test.com');
    expect(mockJwtService.sign).toHaveBeenCalled();
  });

  // =====================================================
  // 📝 register
  // =====================================================

  it('should register a new user and send verification email', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue(null);

    mockUsuariosService.create.mockResolvedValue({
      id: 2,
      email: 'novo@test.com',
    });

    const dto = {
      nomeCompleto: 'Novo Usuário',
      email: 'novo@test.com',
      senha: '123456',
      telefone: '11999999999',
      cpf: '529.982.247-25',
      dataNascimento: new Date('1995-08-20'),
      cep: '01001-000',
      numero: '123',
    };

    const result = await service.register(dto as any);

    expect(result).toEqual({
      message: expect.any(String),
    });

    expect(mockEmailService.enviarEmailSimples).toHaveBeenCalled();
    expect(mockUsuariosService.create).toHaveBeenCalled();
  });

  it('should throw ConflictException if email already exists', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'exists@test.com',
    });

    await expect(
      service.register({ email: 'exists@test.com' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // =====================================================
  // ✅ confirmarEmail
  // =====================================================

  it('should confirm email with valid code', async () => {
    mockUsuariosService.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      emailVerificado: false,
      codigoVerificacaoEmail: '123456',
      codigoExpiraEm: new Date(Date.now() + 10000),
    });

    const result = await service.confirmarEmail({
      email: 'test@test.com',
      codigo: '123456',
    });

    expect(result.message).toContain('sucesso');
    expect(mockUsuariosService.atualizar).toHaveBeenCalled();
  });

  it('should throw error if confirmation code is invalid', async () => {
    mockUsuariosService.findByEmail.mockResolvedValue({
      id: 1,
      emailVerificado: false,
      codigoVerificacaoEmail: '654321',
      codigoExpiraEm: new Date(Date.now() + 10000),
    });

    await expect(
      service.confirmarEmail({
        email: 'test@test.com',
        codigo: '123456',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  // =====================================================
  // 🔁 reenviarCodigo
  // =====================================================

  it('should resend verification code if email exists', async () => {
    mockUsuariosService.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      emailVerificado: false,
    });

    const result = await service.reenviarCodigo({
      email: 'test@test.com',
    });

    expect(result.message).toBeDefined();
    expect(mockEmailService.enviarEmailSimples).toHaveBeenCalled();
    expect(mockUsuariosService.atualizar).toHaveBeenCalled();
  });

  it('should silently succeed if email does not exist', async () => {
    mockUsuariosService.findByEmail.mockResolvedValue(null);

    const result = await service.reenviarCodigo({
      email: 'inexistente@test.com',
    });

    expect(result.message).toBeDefined();
    expect(mockEmailService.enviarEmailSimples).not.toHaveBeenCalled();
  });
});
