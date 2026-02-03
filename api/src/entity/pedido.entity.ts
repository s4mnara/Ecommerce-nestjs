import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Column, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { ItemPedido } from './item-pedido.entity';

export type StatusPedido = 'pendente' | 'finalizado' | 'cancelado';

@Entity()
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

    @ManyToOne(() => Usuario, usuario => usuario.pedidos, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @OneToMany(() => ItemPedido, item => item.pedido, { cascade: true, eager: true })
  itens: ItemPedido[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'varchar', default: 'pendente' })
  status: StatusPedido; // substitui finalizado
}
