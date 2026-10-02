import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export type MetodoPagamento = 'cartao' | 'pix' | 'boleto';

export class ProcessarPagamentoDto {
  @IsNotEmpty({ message: 'Método de pagamento é obrigatório' })
  @IsEnum(['cartao', 'pix', 'boleto'], {
    message: 'Método deve ser cartao, pix ou boleto',
  })
  metodo: MetodoPagamento;

  @IsNotEmpty({ message: 'Valor é obrigatório' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Valor deve ser numérico' })
  @Min(0, { message: 'Valor deve ser maior ou igual a zero' })
  valor: number;

  @IsOptional()
  @IsString()
  numeroCartao?: string;

  @IsOptional()
  @IsString()
  nomeTitular?: string;

  @IsOptional()
  @IsString()
  validade?: string;

  @IsOptional()
  @IsString()
  cvv?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parcelas?: number;
}
