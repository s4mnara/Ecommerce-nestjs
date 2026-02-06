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
import {
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  // 🔹 Mocks
  const mockUsuariosService = {
    findByEmailWithPassword: jest.fn(),
    create: jest.fn(),
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
    });

    const result = await service.validateUser(
      'admin@test.com',
      '123456',
    );

    expect(result).toHaveProperty('id');
    expect(result).not.toHaveProperty('senha');
    expect(mockUsuariosService.resetarTentativas).toHaveBeenCalledWith(1);
  });

  it('should throw UnauthorizedException if user not found', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      service.validateUser('notfound@test.com', '123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user is blocked', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'blocked@test.com',
      senha: 'hashed',
      tentativasLogin: 5,
      bloqueadoAte: new Date(Date.now() + 10 * 60 * 1000),
    });

    await expect(
      service.validateUser('blocked@test.com', '123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockUsuariosService.incrementarTentativa).not.toHaveBeenCalled();
  });

  it('should increment login attempts when password is invalid', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      senha: 'hashed',
      tentativasLogin: 2,
      bloqueadoAte: null,
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.validateUser('test@test.com', 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockUsuariosService.incrementarTentativa).toHaveBeenCalledWith(1);
  });

  it('should block user after 5 invalid login attempts', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'lock@test.com',
      senha: 'hashed',
      tentativasLogin: 4,
      bloqueadoAte: null,
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.validateUser('lock@test.com', 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockUsuariosService.incrementarTentativa).toHaveBeenCalledWith(1);
    expect(mockUsuariosService.bloquearUsuario).toHaveBeenCalledWith(1, 15);
    expect(mockLogsService.registrarLog).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: 'Usuário bloqueado por tentativas de login',
      }),
    );
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
    expect(mockLogsService.registrarLog).toHaveBeenCalled();
  });

  // =====================================================
  // 📝 register
  // =====================================================

  it('should register a new user', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue(null);

    mockUsuariosService.create.mockResolvedValue({
      id: 2,
      nomeCompleto: 'Novo Usuário',
      email: 'novo@test.com',
      role: 'cliente',
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
      complemento: 'Apto 12',
    };

    const result = await service.register(dto as any);

    expect(result.email).toBe('novo@test.com');
    expect(mockViaCepService.buscarEndereco).toHaveBeenCalledWith(
      '01001-000',
    );
    expect(mockUsuariosService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cpf: '52998224725',
      }),
    );
    expect(mockLogsService.registrarLog).toHaveBeenCalled();
  });

  it('should throw ConflictException if email already exists', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'exists@test.com',
    });

    const dto = {
      nomeCompleto: 'Usuário',
      email: 'exists@test.com',
      senha: '123456',
      cep: '01001-000',
      numero: '10',
    };

    await expect(service.register(dto as any))
      .rejects
      .toBeInstanceOf(ConflictException);
  });
});
