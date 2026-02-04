// src/pagamentos/pagamentos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';
import { Pedido } from 'src/entity/pedido.entity';
import { Pagamento } from 'src/entity/pagamento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pagamento,
      Pedido,
    ]),
  ],
  controllers: [PagamentosController],
  providers: [PagamentosService],
  exports: [
    PagamentosService,
    TypeOrmModule,
  ],
})
export class PagamentosModule {}

