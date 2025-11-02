import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PagamentoController } from './pagamento.controller';
import { PagamentoService } from './pagamento.service';
import { PedidosModule } from '../pedidos/pedidos.module';
import { CarrinhoModule } from '../carrinho/carrinho.module';

@Module({
    imports: [ConfigModule, PedidosModule, CarrinhoModule],
    controllers: [PagamentoController],
    providers: [PagamentoService],
})
export class PagamentoModule {}