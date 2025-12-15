import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'redis', // Dentro do Docker, 'redis' é o serviço
      port: +(process.env.REDIS_PORT || 6379),
      ttl: 60, // TTL padrão em segundos
      prefix: 'cache:', // Prefixo para facilitar visualização no Redis CLI
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
