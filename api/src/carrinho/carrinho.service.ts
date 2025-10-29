import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrinho } from '../entity/carrinho.entity';
import { Produto } from '../entity/produto.entity';
import { Usuario } from '../entity/usuario.entity';
import { ItemCarrinho } from '../entity/item-carrinho.entity';
import { KafkaProducer } from '../kafka/kafka.producer';

@Injectable()
export class CarrinhoService {
  constructor(
    @InjectRepository(Carrinho)
    private readonly carrinhoRepository: Repository<Carrinho>,

    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(ItemCarrinho)
    private readonly itemCarrinhoRepository: Repository<ItemCarrinho>,

    private readonly kafkaProducer: KafkaProducer,
  ) {}

  async adicionarProduto(usuarioId: number, produtoId: number, quantidade: number) {
    const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');

    const produto = await this.produtoRepository.findOne({ where: { id: produtoId } });
    if (!produto) throw new NotFoundException('Produto não encontrado.');

    //  Busca ou cria o carrinho automaticamente
    let carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });

    if (!carrinho) {
      carrinho = this.carrinhoRepository.create({ usuario, itens: [] });
      carrinho = await this.carrinhoRepository.save(carrinho);
    }

    //  Verifica se o produto já está no carrinho
    let item = carrinho.itens.find((i) => i.produto.id === produto.id);

    if (item) {
      item.quantidade += quantidade;
      item.subtotal = item.quantidade * produto.preco;
      await this.itemCarrinhoRepository.save(item);
    } else {
      //  Cria o item completo com subtotal
      const novoItem = this.itemCarrinhoRepository.create({
        carrinho,
        produto,
        quantidade,
        subtotal: produto.preco * quantidade,
      });
      await this.itemCarrinhoRepository.save(novoItem);
      carrinho.itens.push(novoItem);
    }

    //  Atualiza o total
    const totalAtual = carrinho.itens.reduce((acc, i) => acc + i.subtotal, 0);
    carrinho.total = totalAtual;
    await this.carrinhoRepository.save(carrinho);

    //  Emite evento Kafka
    await this.kafkaProducer.enviarProdutoAdicionado(usuario.id, produto.id, quantidade, totalAtual);

    return { message: 'Produto adicionado ao carrinho com sucesso!', carrinho };
  }

  async removerProduto(usuarioId: number, produtoId: number) {
    const carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });

    if (!carrinho) throw new NotFoundException('Carrinho não encontrado.');

    const item = carrinho.itens.find((i) => i.produto.id === produtoId);
    if (!item) throw new NotFoundException('Produto não está no carrinho.');

    await this.itemCarrinhoRepository.remove(item);

    carrinho.itens = carrinho.itens.filter((i) => i.id !== item.id);
    carrinho.total = carrinho.itens.reduce((acc, i) => acc + i.subtotal, 0);
    await this.carrinhoRepository.save(carrinho);

    //  Kafka
    await this.kafkaProducer.enviarProdutoRemovido(usuarioId, produtoId, carrinho.total);

    return { message: 'Produto removido do carrinho com sucesso.', carrinho };
  }

  async limparCarrinho(usuarioId: number) {
    const carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'usuario'],
    });

    if (!carrinho) throw new NotFoundException('Carrinho não encontrado.');

    await this.itemCarrinhoRepository.remove(carrinho.itens);
    carrinho.itens = [];
    carrinho.total = 0;
    await this.carrinhoRepository.save(carrinho);

    //  Kafka
    await this.kafkaProducer.enviarCarrinhoLimpo(usuarioId);

    return { message: 'Carrinho limpo com sucesso.' };
  }

  async obterCarrinho(usuarioId: number) {
    let carrinho = await this.carrinhoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['itens', 'itens.produto', 'usuario'],
    });

    if (!carrinho) {
      const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');

      carrinho = this.carrinhoRepository.create({ usuario, itens: [], total: 0 });
      carrinho = await this.carrinhoRepository.save(carrinho);
    }

    return carrinho;
  }
}

