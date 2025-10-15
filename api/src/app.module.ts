import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CarrinhoModule } from './carrinho/carrinho.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { ProdutosModule } from './produtos/produtos.module';

@Module({
  imports: [
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'db',           // nome do serviço do docker-compose
  port: 5432,
  username: 'postgres', 
  password: 'postgres', 
  database: 'loja_db', 
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
}),

    UsuariosModule,
    CarrinhoModule,
    PedidosModule,
    ProdutosModule,
  ],
})
export class AppModule {}
