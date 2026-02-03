import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from '../entity/usuario.entity';

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  acao: string;  

  @Column({ type: 'text', nullable: true })
  detalhes: string;

  @Column({ nullable: true })
  rota: string;

  @Column({ nullable: true })
  metodo: string;

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn()
  criadoEm: Date;

  @ManyToOne(() => Usuario, usuario => usuario.logs, {
  nullable: true,
  onDelete: 'SET NULL',
})
@JoinColumn({ name: 'usuarioId' })
usuario: Usuario;

}
