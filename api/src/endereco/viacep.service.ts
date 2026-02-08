import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ViaCepService {
  async buscarEndereco(cep?: string) {
    if (!cep) {
      return null;
    }

    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      throw new BadRequestException('CEP inválido');
    }

    const { data } = await axios.get(
      `https://viacep.com.br/ws/${cepLimpo}/json/`,
    );

    if (data.erro) {
      throw new BadRequestException('CEP inválido');
    }

    return {
      cep: data.cep,
      rua: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
    };
  }
}
