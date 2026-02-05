import { Column } from 'typeorm';

export class Endereco {
  @Column()
  cep: string;

  @Column()
  rua: string;

  @Column()
  bairro: string;

  @Column()
  cidade: string;

  @Column()
  estado: string;

  @Column()
  numero: string;

  @Column({ nullable: true })
  complemento?: string;
}
