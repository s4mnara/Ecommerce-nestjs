import { Controller, Patch, Param, UseGuards } from '@nestjs/common';
import { MetodoPagamentoService } from './metodos-pagamento.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type{ MetodoPagamento } from '../entity/metodos-pagamento.entity';
import { BadRequestException } from '@nestjs/common';

@Controller('admin/metodos-pagamento')
export class MetodoPagamentoController {
  constructor(private readonly pagamentoService: MetodoPagamentoService) {}

 @Patch(':metodo/:status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async toggleMetodo(
  @Param('metodo') metodo: string, 
  @Param('status') status: 'ativar' | 'desativar',
) {
  // validação do valor do método
  if (!['cartao', 'pix', 'boleto'].includes(metodo)) {
    throw new BadRequestException('Método de pagamento inválido');
  }

  const ativo = status === 'ativar';
  return this.pagamentoService.setAtivo(metodo as MetodoPagamento, ativo);
}

}
