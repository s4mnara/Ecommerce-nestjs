import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async enviarEmailSimples(
    para: string,
    assunto: string,
    mensagem: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: para,
        subject: assunto,
        text: mensagem,
      });

      this.logger.log(`📧 Email enviado para ${para}`);
    } catch (error) {
      this.logger.error('Erro ao enviar email', error);
      throw error;
    }
  }
}
