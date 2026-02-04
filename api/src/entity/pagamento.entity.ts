import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Pedido } from './pedido.entity';

export type MetodoPagamento = 'cartao' | 'pix' | 'boleto';
export type StatusPagamento =
  | 'PENDENTE'
  | 'APPROVED'
  | 'DECLINED'
  | 'CANCELADO';

@Entity('pagamentos')
export class Pagamento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pedido, pedido => pedido.pagamentos, {
    onDelete: 'CASCADE',
  })
  pedido: Pedido;

  @Column({
    type: 'enum',
    enum: ['cartao', 'pix', 'boleto'],
  })
  metodo: MetodoPagamento;

  @Column({
    type: 'enum',
    enum: ['PENDENTE', 'APPROVED', 'DECLINED', 'CANCELADO'],
    default: 'PENDENTE',
  })
  status: StatusPagamento;

  @Column('decimal', { precision: 10, scale: 2 })
  valorOriginal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  valorFinal: number;

  @Column({ type: 'int', nullable: true })
  parcelas: number | null;

    
  @Column({ type: 'varchar', length: 50, nullable: true })
  bandeira: string | null;


  @Column({ type: 'varchar', nullable: true })
  codigoPix: string | null;

  @Column({ type: 'varchar', nullable: true })
  linhaDigitavelBoleto: string | null;

  @Column({ type: 'varchar', nullable: true })
  transactionId: string | null;

  @CreateDateColumn()
  criadoEm: Date;
}
