import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrinho } from '../entity/carrinho.entity';
import { Usuario } from '../entity/usuario.entity';
import { Produto } from '../entity/produto.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { CarrinhoService } from './carrinho.service';
import { CarrinhoController } from './carrinho.controller';
import { TelegramModule } from '../telegram/telegram.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Carrinho, Usuario, Produto, ItemCarrinho]),
    TelegramModule,
    KafkaModule,
  ],
  controllers: [CarrinhoController],
  providers: [CarrinhoService],
  exports: [CarrinhoService],
})
export class CarrinhoModule {}


