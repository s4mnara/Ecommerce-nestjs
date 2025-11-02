import { Controller, Post, Param, ParseIntPipe, Req, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PagamentoService } from './pagamento.service';

@Controller('pagamentos')
export class PagamentoController {
    constructor(private readonly pagamentoService: PagamentoService) {}

    @Post('iniciar/:usuarioId')
    iniciarPagamento(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.pagamentoService.criarCheckoutSession(usuarioId);
    }

    @Post('webhook')
    async handleWebhook(
        @Req() req: RawBodyRequest<any>,
        @Headers('stripe-signature') signature: string,
    ) {
        if (!signature) {
            return { received: false, message: 'No signature header' };
        }
        
        await this.pagamentoService.processarWebhook(req, signature);
        
        return { received: true }; 
    }
}