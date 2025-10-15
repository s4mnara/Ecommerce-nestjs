import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Produto } from './produto.entity';

@Entity()
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn()
  usuario: Usuario;

  @ManyToOne(() => Produto)
  @JoinColumn()
  produto: Produto;

  @Column()
  quantidade: number;

  @Column('decimal')
  total: number;

  @Column({ default: false })
  finalizado: boolean;
}
