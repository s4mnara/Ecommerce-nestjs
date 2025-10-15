import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Produto } from './produto.entity';

@Entity()
export class Carrinho {
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
}
