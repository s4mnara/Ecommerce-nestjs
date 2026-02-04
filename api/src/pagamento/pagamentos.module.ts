import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';
import { Pedido } from 'src/entity/pedido.entity';
import { Pagamento } from 'src/entity/pagamento.entity';
import { MetodoPagamentoConfig } from 'src/entity/metodos-pagamento.entity';
import { MetodoPagamentoController } from './metodos-pagamento.controller';
import { MetodoPagamentoService } from './metodos-pagamento.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pagamento,
      Pedido,
      MetodoPagamentoConfig,
    ]),
  ],
  controllers: [
    PagamentosController,
    MetodoPagamentoController, 
  ],
  providers: [
    PagamentosService,
    MetodoPagamentoService, 
  ],
  exports: [
    PagamentosService,
    MetodoPagamentoService, 
    TypeOrmModule,
  ],
})
export class PagamentosModule {}

