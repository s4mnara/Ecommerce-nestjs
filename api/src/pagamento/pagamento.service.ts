import { Injectable, NotFoundException, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CarrinhoService } from '../carrinho/carrinho.service';
import { PedidosService } from '../pedidos/pedidos.service';

@Injectable()
export class PagamentoService {
    private stripe: Stripe;
    private frontendUrl: string;
    private webhookSecret: string;

    constructor(
        private configService: ConfigService,
        private carrinhoService: CarrinhoService,
        private pedidosService: PedidosService,
    ) {
        this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!;
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY')!;

        // CORREÇÃO TS2322/TS2345: Definir apiVersion como string garantida, ou usar 'any' como fallback
        this.stripe = new Stripe(stripeSecretKey, {
             apiVersion: '2023-10-16' as any, // Asserção 'as any' temporária para resolver o erro
        });
        
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL')!;
    }

    async criarCheckoutSession(usuarioId: number): Promise<{ url: string }> {
        const carrinhoData = await this.carrinhoService.obterCarrinho(usuarioId);

        if (!carrinhoData.itens || carrinhoData.itens.length === 0) {
            throw new NotFoundException('Carrinho vazio. Não é possível iniciar o pagamento.');
        }

        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = carrinhoData.itens.map(item => ({
            price_data: {
                currency: 'brl',
                product_data: {
                    name: item.nome,
                },
                unit_amount: Math.round(item.preco * 100), 
            },
            quantity: item.quantidade,
        }));

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card', 'boleto', 'pix'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${this.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.frontendUrl}/checkout/cancel`,
            client_reference_id: usuarioId.toString(),
            metadata: {
                userId: usuarioId,
            },
        });
        
        // CORREÇÃO TS2322: Verifica se a URL foi gerada corretamente
        if (!session.url) {
            throw new NotFoundException('Falha ao gerar URL de pagamento.');
        }

        return { url: session.url };
    }

    async processarWebhook(req: RawBodyRequest<any>, signature: string): Promise<void> {
        let event: Stripe.Event;

        // CORREÇÃO TS2345: Garantir que a signature não é nula antes de usá-la
        if (!signature) {
             throw new NotFoundException('Webhook Signature is Missing');
        }

        try {
            // A tipagem do req.rawBody é Buffer | null. O constructEvent aceita Buffer.
            // O app.module.ts garante que req.rawBody existe (graças a rawBody: true).
            event = this.stripe.webhooks.constructEvent(
                req.rawBody as Buffer, // Asserção para Buffer, pois JSON não é usado
                signature, 
                this.webhookSecret
            );
        } catch (err) {
            console.error(`Falha na verificação da assinatura do Webhook: ${err.message}`);
            throw new NotFoundException('Webhook Signature Verification Failed');
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            
            const clientReferenceId = session.client_reference_id;
            
            if (!clientReferenceId) {
                 console.error('Webhook recebido sem client_reference_id.');
                 return;
            }
            
            const usuarioId = parseInt(clientReferenceId, 10);
            
            if (session.payment_status === 'paid') {
                console.log(`Pagamento aprovado. Finalizando pedido para o usuário: ${usuarioId}`);

                try {
                    await this.pedidosService.criarPedido(usuarioId); 
                    console.log(`Pedido ${session.id} finalizado e carrinho limpo.`);
                } catch (dbError) {
                    console.error('Erro ao salvar pedido no DB via webhook:', dbError);
                }
            } else {
                console.log(`Pagamento em processamento ou pendente para sessão: ${session.id}`);
            }
        }
    }
}