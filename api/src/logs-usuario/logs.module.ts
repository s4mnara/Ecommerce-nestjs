import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from '../entity/log.entity';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { LogsMiddleware } from './logs.middleware';
import { Usuario } from '../entity/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Log, Usuario])],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogsMiddleware).forRoutes('*'); // Registra log em todas as rotas
  }
}
