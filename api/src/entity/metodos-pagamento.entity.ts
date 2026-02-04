import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type MetodoPagamento = 'cartao' | 'pix' | 'boleto';

@Entity('metodos_pagamento')
export class MetodoPagamentoConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['cartao', 'pix', 'boleto'],
    unique: true,
  })
  metodo: MetodoPagamento;

  @Column({ default: true })
  ativo: boolean;
}
