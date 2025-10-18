import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Carrinho } from '../entity/carrinho.entity';
import { Usuario } from '../entity/usuario.entity';
import { Produto } from '../entity/produto.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity'; 
import { CarrinhoService } from './carrinho.service';
import { CarrinhoController } from './carrinho.controller';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Carrinho, Usuario, Produto, ItemCarrinho]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { brokers: ['kafka:9092'] },
        },
      },
    ]),
    TelegramModule, // adiciona suporte a Telegram
  ],
  controllers: [CarrinhoController],
  providers: [CarrinhoService],
  exports: [CarrinhoService, ClientsModule],
})
export class CarrinhoModule {}
