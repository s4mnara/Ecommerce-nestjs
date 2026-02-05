import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { ProcessarPagamentoDto } from './dto/processar-pagamento.dto';
import { MetodoPagamentoService } from './metodos-pagamento.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('cliente')
@Controller('pagamentos')
export class PagamentosController {
  constructor(
    private readonly pagamentosService: PagamentosService,
    private readonly metodoPagamentoService: MetodoPagamentoService, 
  ) {}


 @Post()
async pagar(@Body() dto: ProcessarPagamentoDto) {
  const ativo = await this.metodoPagamentoService.estaAtivo(dto.metodo);
  if (!ativo) {
    throw new BadRequestException(
      `O método de pagamento '${dto.metodo}' está desativado.`,
    );
  }

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
