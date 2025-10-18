import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Column, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { ItemPedido } from './item-pedido.entity';

@Entity()
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, usuario => usuario.pedidos, { eager: true })
  @JoinColumn()
  usuario: Usuario;

  @OneToMany(() => ItemPedido, item => item.pedido, { cascade: true, eager: true })
  itens: ItemPedido[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ default: false })
  finalizado: boolean;
}

