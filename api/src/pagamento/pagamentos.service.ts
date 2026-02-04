import { Injectable } from '@nestjs/common';

@Injectable()
export class PagamentosService {
  detectarBandeira(numero: string): string {
    if (numero.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(numero)) return 'MASTERCARD';
    if (/^(34|37)/.test(numero)) return 'AMEX';
    if (numero.startsWith('6062')) return 'HIPERCARD';
    return 'DESCONHECIDA';
  }

  calcularJuros(parcelas: number): number {
    if (parcelas <= 1) return 0;
    if (parcelas <= 3) return 0.02;
    if (parcelas <= 6) return 0.035;
    return 0.05;
  }

  async pagarComCartao(valor: number, parcelas: number, numeroCartao: string) {
    const bandeira = this.detectarBandeira(numeroCartao);
    const juros = this.calcularJuros(parcelas);
    const valorFinal = valor * (1 + juros * parcelas);

    return {
      status: Math.random() > 0.2 ? 'APPROVED' : 'DECLINED',
      metodo: 'cartao',
      bandeira,
      parcelas,
      valorOriginal: Number(valor.toFixed(2)),
      valorFinal: Number(valorFinal.toFixed(2)),
      transacaoId: `txn_${Date.now()}`,
    };
  }

  async pagarComPix(valor: number) {
    return {
      status: 'APPROVED',
      metodo: 'pix',
      valorOriginal: Number(valor.toFixed(2)),
      valorFinal: Number(valor.toFixed(2)),
      qrCode: `pix_${Date.now()}`,
      transacaoId: `pix_${Date.now()}`,
    };
  }

  async pagarComBoleto(valor: number) {
    return {
      status: 'PENDENTE',
      metodo: 'boleto',
      valorOriginal: Number(valor.toFixed(2)),
      valorFinal: Number(valor.toFixed(2)),
      codigoBoleto: `34191.${Date.now()}`,
      transacaoId: `bol_${Date.now()}`,
    };
  }
}
