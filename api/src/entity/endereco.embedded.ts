import { Column } from 'typeorm';

export class Endereco {
  @Column({ nullable: true })
  cep?: string;

  @Column({ nullable: true })
  rua?: string;

  @Column({ nullable: true })
  bairro?: string;

  @Column({ nullable: true })
  cidade?: string;

  @Column({ nullable: true })
  estado?: string;

  @Column({ nullable: true })
  numero?: string;

  @Column({ nullable: true })
  complemento?: string;
}
