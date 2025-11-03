import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  NotFoundException,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
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
  constructor(private readonly produtosService: ProdutosService) {}

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
  async create(
    @Body() produto: Partial<Produto>,
    @UploadedFile() imagem?: Express.Multer.File,
  ) {
    if (imagem) {
      produto.imagem = imagem.filename;
    }
    return this.produtosService.create(produto);
  }

  @Get()
  findAll() {
    return this.produtosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.findOne(id);
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() produto: Partial<Produto>,
    @UploadedFile() imagem?: Express.Multer.File,
  ) {
    if (imagem) {
      produto.imagem = imagem.filename;
    }

    const atualizado = await this.produtosService.update(id, produto);
    if (!atualizado) {
      throw new NotFoundException('Produto não encontrado ou nenhum campo para atualizar');
    }
    return atualizado;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.remove(id);
  }
}





// import {
//   Controller,
//   Post,
//   Get,
//   Put,
//   Delete,
//   Param,
//   Body,
//   UploadedFile,
//   UseInterceptors,
//   UseGuards,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { extname } from 'path';
// import { ProdutosService } from './produtos.service';
// import { AuthGuard } from '../auth/auth.guard';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

// @Controller('produtos')
// export class ProdutosController {
//   constructor(private readonly produtosService: ProdutosService) {}

//   @Get()
//   async listarTodos() {
//     return this.produtosService.findAll();
//   }

//   @Get(':id')
//   async buscarPorId(@Param('id') id: number) {
//     return this.produtosService.findById(id);
//   }

//   @Post()
//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles('admin')
//   async criarProduto(@Body() body: any) {
//     return this.produtosService.create(body);
//   }

//   @Put(':id')
//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles('admin')
//   async atualizarProduto(@Param('id') id: number, @Body() body: any) {
//     return this.produtosService.update(id, body);
//   }

//   @Delete(':id')
//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles('admin')
//   async removerProduto(@Param('id') id: number) {
//     return this.produtosService.delete(id);
//   }

//   @Post(':id/imagem')
//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles('admin')
//   @UseInterceptors(FileInterceptor('imagem', {
//     storage: diskStorage({
//       destination: './uploads',
//       filename: (req, file, cb) => {
//         const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
//         cb(null, uniqueName + extname(file.originalname));
//       },
//     }),
//   }))
//   async uploadImagemProduto(
//     @Param('id') id: number,
//     @UploadedFile() imagem: Express.Multer.File
//   ) {
//     const caminhoImagem = imagem ? imagem.filename : null;
//     return this.produtosService.atualizarImagem(id, caminhoImagem);
//   }
// }
