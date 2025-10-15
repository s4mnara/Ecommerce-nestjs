import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Produto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  descricao: string;

  @Column('decimal')
  preco: number;

  @Column()
  estoque: number;
}
