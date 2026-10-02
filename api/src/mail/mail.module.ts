import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './mail.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('SMTP_HOST');
        const from = config.get<string>('SMTP_FROM') || 'noreply@localhost';

        // Sem SMTP configurado: não tentar localhost:587 (quebra register no Docker)
        if (!host || !host.trim()) {
          return {
            transport: { jsonTransport: true },
            defaults: { from },
          };
        }

        return {
          transport: {
            host,
            port: Number(config.get('SMTP_PORT') || 587),
            secure: false,
            auth: {
              user: config.get('SMTP_USER'),
              pass: config.get('SMTP_PASS'),
            },
          },
          defaults: { from },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
