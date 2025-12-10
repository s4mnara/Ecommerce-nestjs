import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../entity/log.entity';
import { Usuario } from '../entity/usuario.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,

    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async registrarLog(data: {
    usuarioId?: number;
    acao: string;
    detalhes?: any;
    rota?: string;
    metodo?: string;
    ip?: string;
  }) {
    const usuario = data.usuarioId
      ? await this.usuarioRepository.findOne({ where: { id: data.usuarioId } })
      : null;

  const log = this.logRepository.create({
        acao: data.acao,
        detalhes: data.detalhes ? JSON.stringify(data.detalhes) : null,
        rota: data.rota,
        metodo: data.metodo,
        ip: data.ip,
        usuario,
      } as unknown as Log);

    return await this.logRepository.save(log);
  }

  async listar() {
    return await this.logRepository.find({
      relations: ['usuario'],
      order: { id: 'DESC' },
    });
  }
}
