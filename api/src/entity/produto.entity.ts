import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Produto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  descricao: string;

  @Column('decimal',{ precision: 10, scale: 2 })
  preco: number;

  @Column()
  estoque: number;

  // @Column({ nullable: true })
  // imagem: string | null;
}

