import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ProdutosService } from './produtos.service';
import { Produto } from '../entity/produto.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('produtos')
export class ProdutosController {
  constructor(
    private readonly produtosService: ProdutosService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // Endpoint de teste de cache
  @Get('teste-cache')
  async testeCache() {
    await this.cacheManager.set('teste', { ok: true }, 10);
    const val = await this.cacheManager.get('teste');
    console.log('Cache teste:', val);
    return val;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(
    FileInterceptor('imagem', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async create(@Body() produto: Partial<Produto>, @UploadedFile() imagem?: Express.Multer.File) {
    if (imagem) produto.imagem = imagem.filename;
    const criado = await this.produtosService.create(produto);

    // Limpa cache da lista de produtos
    await this.cacheManager.del('produtos_todos');
    console.log('Cache removido: produtos_todos (após create)');

    return criado;
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('produtos_todos')
  @CacheTTL(60)
  findAll() {
    console.log('Buscando produtos - cache interceptor');
    return this.produtosService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const cacheKey = `produto_${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const produto = await this.produtosService.findOne(id);
    if (!produto) throw new NotFoundException('Produto não encontrado');

    await this.cacheManager.set(cacheKey, produto, 60);
    console.log(`Produto salvo no cache: ${cacheKey}`);

    return produto;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('imagem', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async update(@Param('id', ParseIntPipe) id: number, @Body() produto: Partial<Produto>, @UploadedFile() imagem?: Express.Multer.File) {
    if (imagem) produto.imagem = imagem.filename;
    const atualizado = await this.produtosService.update(id, produto);
    if (!atualizado) throw new NotFoundException('Produto não encontrado ou nenhum campo para atualizar');

    // Limpa cache do produto específico e lista
    await this.cacheManager.del(`produto_${id}`);
    await this.cacheManager.del('produtos_todos');
    console.log(`Cache removido: produto_${id} e produtos_todos (após update)`);

    return atualizado;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.produtosService.remove(id);

    // Limpa cache
    await this.cacheManager.del(`produto_${id}`);
    await this.cacheManager.del('produtos_todos');
    console.log(`Cache removido: produto_${id} e produtos_todos (após delete)`);

    return { message: 'Produto removido com sucesso' };
  }
}
