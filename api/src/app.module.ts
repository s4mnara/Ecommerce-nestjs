import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CarrinhoModule } from './carrinho/carrinho.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { ProdutosModule } from './produtos/produtos.module';
import { Usuario } from './entity/usuario.entity';
import { Produto } from './entity/produto.entity';
import { Carrinho } from './entity/carrinho.entity';
import { Pedido } from './entity/pedido.entity';
import { ItemCarrinho } from './entity/item-carrinho.entity';
import { ItemPedido } from './entity/item-pedido.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'loja_db',
      entities: [
        Usuario,
        Produto,
        Carrinho,
        Pedido,
        ItemCarrinho,
        ItemPedido,
      ],
      synchronize: true,
    }),
    AuthModule,
    UsuariosModule,
    CarrinhoModule,
    PedidosModule,
    ProdutosModule,
  ],
})
export class AppModule {}

