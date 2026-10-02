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
      const info = await this.mailerService.sendMail({
        to: para,
        subject: assunto,
        text: mensagem,
      });

      this.logger.log(`Email enviado/simulado para ${para}`);
      if (info?.message) {
        this.logger.debug(`Conteúdo (jsonTransport): ${info.message}`);
      }
    } catch (error) {
      // Não derruba o fluxo de cadastro se SMTP estiver indisponível
      this.logger.error('Erro ao enviar email (ignorado)', error);
    }
  }
}
