import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ViaCepService {
  async buscarEndereco(cep: string) {
    const cepLimpo = cep.replace(/\D/g, '');

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
