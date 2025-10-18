import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Pedido } from './pedido.entity';
import { Produto } from './produto.entity';

@Entity()
export class ItemPedido {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pedido, pedido => pedido.itens)
  pedido: Pedido;

  @ManyToOne(() => Produto, { eager: true })
  produto: Produto;

  @Column({ default: 1 })
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
}
