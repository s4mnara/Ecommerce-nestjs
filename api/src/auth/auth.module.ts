import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt'; 
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LogsModule } from 'src/logs-usuario/logs.module';
import { EnderecoModule } from 'src/endereco/enderco.module';
import { EmailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    UsuariosModule,
    ConfigModule,
    LogsModule,
    EmailModule,
    EnderecoModule,
    JwtModule.registerAsync({
      imports: [ConfigModule,
        EnderecoModule
      ],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.getOrThrow<string>('JWT_SECRET');
        const expiresIn = configService.getOrThrow<string>('JWT_EXPIRES_IN');

        return {
          secret: secret,
          signOptions: {
            expiresIn: expiresIn,
          },
        } as JwtModuleOptions; 
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}