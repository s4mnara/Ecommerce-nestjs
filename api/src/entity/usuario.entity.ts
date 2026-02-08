import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { Carrinho } from './carrinho.entity';
import { Pedido } from './pedido.entity';
import { Log } from './log.entity';
import { Endereco } from './endereco.embedded';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  senha: string;

  @Column({ default: 'cliente' })
  role: string;

  @Column({ nullable: true })
  telefone?: string;

  @Column({ nullable: true, unique: true })
  cpf?: string;

  @Column({ type: 'date', nullable: true })
  dataNascimento?: Date;

  @Column(() => Endereco)
  endereco?: Endereco;

  @OneToMany(() => Carrinho, carrinho => carrinho.usuario)
  carrinhos: Carrinho[];

  @OneToMany(() => Pedido, pedido => pedido.usuario)
  pedidos: Pedido[];

  @OneToMany(() => Log, log => log.usuario)
  logs: Log[];

  @Column({ default: 0 })
  tentativasLogin: number;

  @Column({ type: 'timestamp', nullable: true })
  bloqueadoAte: Date | null;

  @Column({ default: false })
  emailVerificado: boolean;

  @Column({ nullable: true })
  codigoVerificacaoEmail: string;

  @Column({ type: 'timestamp', nullable: true })
  codigoExpiraEm: Date;


}
