import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetodoPagamentoConfig, MetodoPagamento } from '../entity/metodos-pagamento.entity';

@Injectable()
export class MetodoPagamentoService implements OnModuleInit {
  constructor(
    @InjectRepository(MetodoPagamentoConfig)
    private readonly repo: Repository<MetodoPagamentoConfig>,
  ) {}

  // Seed automático ao iniciar o módulo
  async onModuleInit() {
    const metodos: MetodoPagamento[] = ['cartao', 'pix', 'boleto'];
    for (const metodo of metodos) {
      const exists = await this.repo.findOne({ where: { metodo } });
      if (!exists) {
        await this.repo.save({ metodo, ativo: true });
      }
    }
  }

  async setAtivo(metodo: MetodoPagamento, ativo: boolean) {
    const registro = await this.repo.findOne({ where: { metodo } });
    if (!registro) throw new NotFoundException('Método de pagamento não encontrado');

    registro.ativo = ativo;
    return this.repo.save(registro);
  }

  async estaAtivo(metodo: MetodoPagamento) {
    const registro = await this.repo.findOne({ where: { metodo } });
    if (!registro) throw new NotFoundException('Método de pagamento não encontrado');

    return registro.ativo;
  }
}
