// src/usuario/usuarios.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Usuario } from '../entity/usuario.entity';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    TelegramModule,

    // Adiciona o Kafka Client aqui
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'usuarios',
            brokers: ['kafka:9092'], 
          },
          consumer: {
            groupId: 'usuarios-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService, ClientsModule],
})
export class UsuariosModule {}
