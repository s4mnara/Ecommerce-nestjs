import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Column,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { ItemPedido } from './item-pedido.entity';
import { Pagamento } from './pagamento.entity';

export type StatusPedido = 'pendente' | 'finalizado' | 'cancelado';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, usuario => usuario.pedidos, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @OneToMany(() => ItemPedido, item => item.pedido, {
    cascade: true,
    eager: true,
  })
  itens: ItemPedido[];

  @OneToMany(() => Pagamento, pagamento => pagamento.pedido, {
    cascade: true,
    eager: true,
  })
  pagamentos: Pagamento[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'varchar', default: 'pendente' })
  status: StatusPedido;
}
