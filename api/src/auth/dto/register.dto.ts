import { IsEmail, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { IsCPF } from '../../common/validators/cpf.validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  senha: string;

  @IsOptional()
  telefone?: string;

  @IsOptional()
  @IsCPF({ message: 'CPF inválido' })
  cpf?: string;

  @IsOptional()
  dataNascimento?: Date;

  // Endereço opcional no cadastro — pode ser preenchido depois (perfil/checkout)
  @IsOptional()
  cep?: string;

  @ValidateIf((o) => !!o.cep)
  @IsNotEmpty({ message: 'Número é obrigatório quando o CEP é informado' })
  numero?: string;

  @IsOptional()
  complemento?: string;
}
