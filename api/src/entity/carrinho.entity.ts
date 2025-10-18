import { Entity, PrimaryGeneratedColumn, OneToMany, Column, ManyToOne } from 'typeorm';
import { ItemCarrinho } from './item-carrinho.entity.js';
import { Usuario } from './usuario.entity';

@Entity()
export class Carrinho {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, usuario => usuario.carrinhos)
  usuario: Usuario;

  @OneToMany(() => ItemCarrinho, item => item.carrinho, { cascade: ['insert', 'update'], eager: true })
  itens: ItemCarrinho[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;
}