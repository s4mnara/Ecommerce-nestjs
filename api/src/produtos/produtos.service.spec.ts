import { Test, TestingModule } from '@nestjs/testing';
import { ProdutosService } from './produtos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Produto } from '../entity/produto.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProdutosService', () => {
  let service: ProdutosService;

  const mockProdutoRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdutosService,
        {
          provide: getRepositoryToken(Produto),
          useValue: mockProdutoRepository,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<ProdutosService>(ProdutosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================
  // findAll
  // ========================

  it('should return products from cache if exists', async () => {
    const produtos = [{ id: 1, nome: 'Whey' }];
    mockRedis.get.mockResolvedValue(JSON.stringify(produtos));

    const result = await service.findAll();

    expect(result).toEqual(produtos);
    expect(mockProdutoRepository.find).not.toHaveBeenCalled();
  });

  it('should fetch products from DB and cache if not cached', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockProdutoRepository.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(mockProdutoRepository.find).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  // ========================
  // findOne
  // ========================

  it('should return product from cache if exists', async () => {
    const produto = { id: 1, nome: 'Creatina' };
    mockRedis.get.mockResolvedValue(JSON.stringify(produto));

    const result = await service.findOne(1);

    expect(result).toEqual(produto);
    expect(mockProdutoRepository.findOneBy).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if product does not exist', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockProdutoRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // ========================
  // create
  // ========================

  it('should create product and invalidate cache', async () => {
    const produto = { id: 1, nome: 'Pré-treino' };

    mockProdutoRepository.create.mockReturnValue(produto);
    mockProdutoRepository.save.mockResolvedValue(produto);

    const result = await service.create({ nome: 'Pré-treino' });

    expect(result).toEqual(produto);
    expect(mockRedis.del).toHaveBeenCalledWith('produtos:all');
  });

  // ========================
  // update
  // ========================

  it('should update product and invalidate cache', async () => {
    const produto = { id: 1, nome: 'Antigo', estoque: 10 };

    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue(produto as Produto);

    mockProdutoRepository.save.mockResolvedValue({
      ...produto,
      nome: 'Novo',
    });

    const result = await service.update(1, { nome: 'Novo' });

    expect(result.nome).toBe('Novo');
    expect(mockRedis.del).toHaveBeenCalledWith('produtos:all');
    expect(mockRedis.del).toHaveBeenCalledWith('produtos:1');
  });

  // ========================
  // remove
  // ========================

  it('should delete product and invalidate cache', async () => {
    mockProdutoRepository.delete.mockResolvedValue({});

    await service.remove(1);

    expect(mockProdutoRepository.delete).toHaveBeenCalledWith(1);
    expect(mockRedis.del).toHaveBeenCalledWith('produtos:all');
    expect(mockRedis.del).toHaveBeenCalledWith('produtos:1');
  });
});
