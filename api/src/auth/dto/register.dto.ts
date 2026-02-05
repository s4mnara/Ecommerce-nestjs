import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { IsCPF } from '../../common/validators/cpf.validator';

export class RegisterDto {
  @IsNotEmpty()
  nomeCompleto: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  senha: string;

  @IsOptional()
  telefone?: string;

  @IsOptional()
  @IsCPF({ message: 'CPF inválido' })
  cpf?: string;

  @IsOptional()
  dataNascimento?: Date;

  // ViaCEP
  @IsNotEmpty()
  cep: string;

  @IsNotEmpty()
  numero: string;

  @IsOptional()
  complemento?: string;
}
