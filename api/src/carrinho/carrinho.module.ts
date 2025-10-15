import { Module } from '@nestjs/common';
import { CarrinhoService } from './carrinho.service';
import { CarrinhoController } from './carrinho.controller';

@Module({
  providers: [CarrinhoService],
  controllers: [CarrinhoController]
})
export class CarrinhoModule {}
