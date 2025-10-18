import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../entity/usuario.entity';
import { UsuariosService } from './usuarios.service';
import { TelegramService } from '../telegram/telegram.service';
import { UsuariosController } from './usuarios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [UsuariosController], 
  providers: [UsuariosService, TelegramService],
  exports: [UsuariosService],
})
export class UsuariosModule {}

