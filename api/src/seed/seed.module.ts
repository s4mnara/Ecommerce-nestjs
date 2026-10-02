import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from '../entity/produto.entity';
import { Usuario } from '../entity/usuario.entity';
import { SeedService } from './seed.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Produto, Usuario]), RedisModule],
  providers: [SeedService],
})
export class SeedModule {}
