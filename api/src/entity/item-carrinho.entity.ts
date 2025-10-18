import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Carrinho } from './carrinho.entity';
import { Produto } from './produto.entity';

@Entity()
export class ItemCarrinho {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Carrinho, carrinho => carrinho.itens, { onDelete: 'CASCADE' })
  carrinho: Carrinho;

  @ManyToOne(() => Produto, { eager: true, onDelete: 'RESTRICT' })
  produto: Produto;

  @Column()
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;
}