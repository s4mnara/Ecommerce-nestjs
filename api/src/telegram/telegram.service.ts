import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  }

  async enviarMensagem(chatId: string, mensagem: string): Promise<void> {
    try {
      await axios.post(this.apiUrl, {
        chat_id: chatId,
        text: mensagem,
        parse_mode: 'HTML',
      });
      console.log(`Mensagem Telegram enviada para o chat ID: ${chatId}`);
    } catch (error) {
      console.error(`Erro ao enviar mensagem Telegram para ${chatId}:`, error.message);
    }
  }
}
