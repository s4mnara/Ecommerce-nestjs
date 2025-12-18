import { Test, TestingModule } from '@nestjs/testing';
import { CarrinhoService } from './carrinho.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Carrinho } from '../entity/carrinho.entity';
import { Produto } from '../entity/produto.entity';
import { Usuario } from '../entity/usuario.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { LogsService } from '../logs-usuario/logs.service';
import { NotFoundException } from '@nestjs/common';

describe('CarrinhoService', () => {
  let service: CarrinhoService;

  const mockCarrinhoRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProdutoRepo = {
    findOne: jest.fn(),
  };

  const mockUsuarioRepo = {
    findOne: jest.fn(),
  };

  const mockItemRepo = {
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockLogsService = {
    registrarLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarrinhoService,
        { provide: getRepositoryToken(Carrinho), useValue: mockCarrinhoRepo },
        { provide: getRepositoryToken(Produto), useValue: mockProdutoRepo },
        { provide: getRepositoryToken(Usuario), useValue: mockUsuarioRepo },
        { provide: getRepositoryToken(ItemCarrinho), useValue: mockItemRepo },
        { provide: LogsService, useValue: mockLogsService },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile();

    service = module.get<CarrinhoService>(CarrinhoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================
  // adicionarProduto
  // ========================

  it('should add product to cart', async () => {
    mockUsuarioRepo.findOne.mockResolvedValue({ id: 1 });
    mockProdutoRepo.findOne.mockResolvedValue({ id: 1, preco: 50 });
    mockCarrinhoRepo.findOne.mockResolvedValue(null);

    mockCarrinhoRepo.create.mockReturnValue({
      id: 1,
      usuario: { id: 1 },
      itens: [],
      total: 0,
    });

    mockCarrinhoRepo.save.mockImplementation(c => c);

    mockItemRepo.create.mockReturnValue({
      id: 1,
      produto: { id: 1, preco: 50 },
      quantidade: 2,
      subtotal: 100,
    });

    jest
      .spyOn(service, 'obterCarrinho')
      .mockResolvedValue({ total: '100.00' } as any);

    const result = await service.adicionarProduto(1, 1, 2);

    expect(result.total).toBe('100.00');
    expect(mockRedis.del).toHaveBeenCalled();
    expect(mockLogsService.registrarLog).toHaveBeenCalled();
  });

  // ========================
  // atualizarQuantidade
  // ========================

  it('should update product quantity in cart', async () => {
    const carrinho = {
      id: 1,
      usuario: { id: 1 },
      itens: [
        {
          id: 1,
          produto: { id: 1, preco: 50 },
          quantidade: 1,
          subtotal: 50,
        },
      ],
      total: 50,
    };

    mockCarrinhoRepo.findOne.mockResolvedValue(carrinho);
    mockItemRepo.save.mockResolvedValue({});
    mockCarrinhoRepo.save.mockResolvedValue(carrinho);

    jest
      .spyOn(service, 'obterCarrinho')
      .mockResolvedValue({ total: '150.00' } as any);

    const result = await service.atualizarQuantidade(1, 1, 3);

    expect(result.total).toBe('150.00');
    expect(mockRedis.del).toHaveBeenCalled();
  });

  // ========================
  // removerProduto
  // ========================

  it('should remove product from cart', async () => {
    const carrinho = {
      id: 1,
      usuario: { id: 1 },
      itens: [
        {
          id: 1,
          produto: { id: 1, preco: 50 },
          quantidade: 1,
          subtotal: 50,
        },
      ],
      total: 50,
    };

    mockCarrinhoRepo.findOne.mockResolvedValue(carrinho);
    mockItemRepo.remove.mockResolvedValue({});
    mockCarrinhoRepo.save.mockResolvedValue(carrinho);

    jest
      .spyOn(service, 'obterCarrinho')
      .mockResolvedValue({ total: '0.00' } as any);

    const result = await service.removerProduto(1, 1);

    expect(result.total).toBe('0.00');
    expect(mockRedis.del).toHaveBeenCalled();
  });

  // ========================
  // limparCarrinho
  // ========================

  it('should clear cart', async () => {
    const carrinho = {
      id: 1,
      usuario: { id: 1 },
      itens: [{ id: 1 }],
      total: 100,
    };

    mockCarrinhoRepo.findOne.mockResolvedValue(carrinho);
    mockItemRepo.remove.mockResolvedValue({});
    mockCarrinhoRepo.save.mockResolvedValue(carrinho);

    const result = await service.limparCarrinho(1);

    expect(result.message).toBe('Carrinho limpo com sucesso.');
    expect(mockRedis.del).toHaveBeenCalled();
  });

  // ========================
  // obterCarrinho
  // ========================

  it('should return cart from cache if exists', async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify({ total: '200.00' }),
    );

    const result = await service.obterCarrinho(1);

    expect(result.total).toBe('200.00');
    expect(mockCarrinhoRepo.findOne).not.toHaveBeenCalled();
  });

  it('should throw if user does not exist', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockCarrinhoRepo.findOne.mockResolvedValue(null);
    mockUsuarioRepo.findOne.mockResolvedValue(null);

    await expect(service.obterCarrinho(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
