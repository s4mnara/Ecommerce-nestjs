export type MetodoPagamento = 'cartao' | 'pix' | 'boleto';

export class ProcessarPagamentoDto {
  metodo: MetodoPagamento;

  valor: number;

  numeroCartao?: string;
  nomeTitular?: string;
  validade?: string;
  cvv?: string;
  parcelas?: number;
}
