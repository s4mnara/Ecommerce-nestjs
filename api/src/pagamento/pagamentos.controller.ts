import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { ProcessarPagamentoDto } from './dto/processar-pagamento.dto';

@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentosService: PagamentosService) {}

  @Post()
  async pagar(@Body() dto: ProcessarPagamentoDto) {
    switch (dto.metodo) {
      case 'cartao':
        if (!dto.numeroCartao || !dto.parcelas) {
          throw new BadRequestException(
            'Número do cartão e parcelas são obrigatórios',
          );
        }

        return this.pagamentosService.pagarComCartao(
          dto.valor,
          dto.parcelas,
          dto.numeroCartao,
        );

      case 'pix':
        return this.pagamentosService.pagarComPix(dto.valor);

      case 'boleto':
        return this.pagamentosService.pagarComBoleto(dto.valor);

      default:
        throw new BadRequestException('Método de pagamento inválido');
    }
  }
}

