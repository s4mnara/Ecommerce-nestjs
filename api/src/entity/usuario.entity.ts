import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Carrinho } from './carrinho.entity';
import { Pedido } from './pedido.entity';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  // senha não é retornada por padrão
  @Column({ select: false })
  senha: string;

  // role: 'cliente' ou 'admin'
  @Column({ default: 'cliente' })
  role: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  telegramChatId: string;

  @OneToMany(() => Carrinho, carrinho => carrinho.usuario)
  carrinhos: Carrinho[];

  @OneToMany(() => Pedido, pedido => pedido.usuario)
  pedidos: Pedido[];
}
