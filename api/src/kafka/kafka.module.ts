// src/kafka/kafka.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaConsumer } from './kafka.consumer';
import { Usuario } from '../entity/usuario.entity';
import { TelegramModule } from '../telegram/telegram.module'; 

@Module({
  imports: [
    TelegramModule,
    TypeOrmModule.forFeature([Usuario]),
  ],
  providers: [KafkaConsumer],
})
export class KafkaModule {}