import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { Produto } from '../entity/produto.entity';
import { Usuario } from '../entity/usuario.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepo: Repository<Produto>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production' && process.env.SEED_DEMO !== 'true') {
      return;
    }

    await this.seedUsers();
    await this.seedProducts();
  }

  private async seedUsers() {
    const demos = [
      {
        nome: 'Admin PowerFit',
        email: 'admin@powerfit.com',
        senha: 'Admin@123',
        role: 'admin',
      },
      {
        nome: 'Cliente Demo',
        email: 'cliente@powerfit.com',
        senha: 'Cliente@123',
        role: 'cliente',
      },
    ];

    for (const demo of demos) {
      const existing = await this.usuarioRepo.findOne({
        where: { email: demo.email },
      });
      if (existing) {
        this.logger.log(`Demo user já existe: ${demo.email}`);
        continue;
      }

      const hash = await bcrypt.hash(demo.senha, 10);
      await this.usuarioRepo.save(
        this.usuarioRepo.create({
          nome: demo.nome,
          email: demo.email,
          senha: hash,
          role: demo.role,
          emailVerificado: true,
          tentativasLogin: 0,
        }),
      );
      this.logger.log(
        `Demo user criado: ${demo.email} / ${demo.senha} (${demo.role})`,
      );
    }

    this.logger.log(
      '=== DEMO LOGINS === admin@powerfit.com / Admin@123 | cliente@powerfit.com / Cliente@123',
    );
  }

  private demoProducts(): Partial<Produto>[] {
    // Paths served by the React frontend (public/assets/products)
    return [
      {
        nome: 'PowerFit Whey Protein Concentrado 900g',
        descricao:
          'Whey concentrado PowerFit — 24g de proteína por dose, sabor chocolate belga. Ideal pós-treino para recuperação muscular.',
        preco: 149.9,
        estoque: 80,
        imagem: '/assets/products/whey-concentrado.png',
      },
      {
        nome: 'PowerFit Whey Isolado 900g',
        descricao:
          'Whey isolado de alta pureza, baixo teor de lactose. Sabor baunilha. Absorção rápida.',
        preco: 219.9,
        estoque: 45,
        imagem: '/assets/products/whey-isolado.png',
      },
      {
        nome: 'PowerFit Creatina Monohidratada 300g',
        descricao:
          'Creatina monohidratada micronizada 100% pura. Aumenta força, potência e volume muscular.',
        preco: 79.9,
        estoque: 120,
        imagem: '/assets/products/creatina.png',
      },
      {
        nome: 'PowerFit BCAA 2:1:1 240 cápsulas',
        descricao:
          'Aminoácidos de cadeia ramificada para reduzir catabolismo e acelerar recuperação.',
        preco: 69.9,
        estoque: 90,
        imagem: '/assets/products/bcaa.png',
      },
      {
        nome: 'PowerFit Pré-Treino Ignite 300g',
        descricao:
          'Fórmula energética com cafeína, beta-alanina e citrulina. Explosão de foco e performance.',
        preco: 99.9,
        estoque: 60,
        imagem: '/assets/products/pre-treino.png',
      },
      {
        nome: 'PowerFit Glutamina 300g',
        descricao:
          'L-Glutamina pura para imunidade, recuperação intestinal e redução de DOMS.',
        preco: 74.9,
        estoque: 70,
        imagem: '/assets/products/glutamina.png',
      },
      {
        nome: 'PowerFit Multivitamínico Daily 60 caps',
        descricao:
          'Complexo vitamínico completo para atletas. Vitaminas A–Z + minerais essenciais.',
        preco: 54.9,
        estoque: 100,
        imagem: '/assets/products/multivitaminico.png',
      },
      {
        nome: 'PowerFit Hipercalórico Mass Gainer 3kg',
        descricao:
          'Ganho de massa com carboidratos complexos e proteína. Sabor cookies & cream.',
        preco: 189.9,
        estoque: 35,
        imagem: '/assets/products/mass-gainer.png',
      },
      {
        nome: 'PowerFit Ômega 3 120 softgels',
        descricao:
          'Óleo de peixe concentrado EPA/DHA. Saúde cardiovascular e anti-inflamatório natural.',
        preco: 59.9,
        estoque: 85,
        imagem: '/assets/products/omega3.png',
      },
      {
        nome: 'PowerFit Colágeno Hidrolisado 300g',
        descricao:
          'Colágeno tipo I e III com vitamina C. Articulações, pele e tecidos conectivos.',
        preco: 64.9,
        estoque: 55,
        imagem: '/assets/products/colageno.png',
      },
      {
        nome: 'PowerFit Termogênico Black Burn 60 caps',
        descricao:
          'Termogênico potente para definição. Cafeína + extratos naturais. Uso diurno.',
        preco: 89.9,
        estoque: 50,
        imagem: '/assets/products/termogenico.png',
      },
      {
        nome: 'PowerFit Barra Proteica (caixa c/ 12)',
        descricao:
          'Barras com 20g de proteína, baixo açúcar. Sabores sortidos amendoim e chocolate.',
        preco: 119.9,
        estoque: 40,
        imagem: '/assets/products/barra-proteica.png',
      },
    ];
  }

  private async seedProducts() {
    const products = this.demoProducts();
    const count = await this.produtoRepo.count();

    if (count === 0) {
      await this.produtoRepo.save(
        products.map((p) => this.produtoRepo.create(p)),
      );
      this.logger.log(`Seed: ${products.length} produtos PowerFit inseridos.`);
      return;
    }

    // Backfill / refresh demo product images (SVG icons -> real tub PNGs).
    // Never overwrite custom uploads outside /assets/products/.
    let updated = 0;
    for (const p of products) {
      const existing = await this.produtoRepo.findOne({
        where: { nome: p.nome },
      });
      if (!existing || !p.imagem) continue;
      const current = existing.imagem || '';
      const isDemoAsset =
        !current ||
        current.endsWith('.svg') ||
        current.startsWith('/assets/products/');
      if (isDemoAsset && current !== p.imagem) {
        existing.imagem = p.imagem;
        await this.produtoRepo.save(existing);
        updated++;
      }
    }
    if (updated > 0) {
      this.logger.log(`Seed: imagens atualizadas em ${updated} produtos.`);
      await this.redis.del('produtos:all');
      this.logger.log('Redis DEL: produtos:all (após seed de imagens)');
    } else {
      this.logger.log(
        `Produtos já existem (${count}); seed de produtos pulado (imagens ok).`,
      );
    }
  }
}
