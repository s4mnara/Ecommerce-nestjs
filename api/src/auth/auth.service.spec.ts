jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LogsService } from '../logs-usuario/logs.service';
import {
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsuariosService = {
    findByEmailWithPassword: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake_jwt_token'),
  };

  const mockLogsService = {
    registrarLog: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 🔐 validateUser

  it('should validate user with correct credentials', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      senha: 'hashed',
      role: 'admin',
    });

    const result = await service.validateUser(
      'test@test.com',
      '123456',
    );

    expect(result).toHaveProperty('id');
    expect(result).not.toHaveProperty('senha');
  });

  it('should throw UnauthorizedException if user not found', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue(
      null,
    );

    await expect(
      service.validateUser('notfound@test.com', '123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password is invalid', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      senha: 'hashed',
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.validateUser('test@test.com', 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  // 🔑 login

  it('should return access_token and user data on login', async () => {
    const usuario = {
      id: 1,
      nome: 'Samara',
      email: 'samara@test.com',
      role: 'admin',
    };

    const result = await service.login(usuario as any);

    expect(result).toHaveProperty('access_token');
    expect(result.usuario.email).toBe('samara@test.com');
    expect(mockLogsService.registrarLog).toHaveBeenCalled();
  });

  // 📝 register

  it('should register a new user', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue(
      null,
    );
    mockUsuariosService.create.mockResolvedValue({
      id: 2,
      nome: 'Novo',
      email: 'novo@test.com',
      role: 'cliente',
    });

    const result = await service.register(
      'Novo',
      'novo@test.com',
      '123456',
    );

    expect(result.email).toBe('novo@test.com');
    expect(mockLogsService.registrarLog).toHaveBeenCalled();
  });

  it('should throw ConflictException if email already exists', async () => {
    mockUsuariosService.findByEmailWithPassword.mockResolvedValue({
      id: 1,
      email: 'exists@test.com',
    });

    await expect(
      service.register('Nome', 'exists@test.com', '123'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
