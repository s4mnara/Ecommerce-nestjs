import { Injectable, Logger } from '@nestjs/common'; // <-- Não se esqueça de importar Logger
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly apiUrl: string;
  private readonly logger = new Logger(TelegramService.name); // <--- Adicione o Logger

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
        this.logger.error('TELEGRAM_BOT_TOKEN não encontrado! Verifique o .env.');
    }
    this.apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  }

  async enviarMensagem(chatId: string, mensagem: string): Promise<void> {
    try {
      await axios.post(this.apiUrl, {
        chat_id: chatId,
        text: mensagem,
        parse_mode: 'HTML',
      });
      this.logger.log(`Mensagem Telegram enviada para o chat ID: ${chatId}`); // <-- Use logger
    } catch (error) {
      // ESTA É A MUDANÇA ESSENCIAL PARA DEBUG:
      const telegramError = error.response?.data?.description || error.message;

      // Use logger.error para aparecer claramente no log do Docker
      this.logger.error(`ERRO TELEGRAM - Chat ${chatId}. Causa: ${telegramError}`); 
    }
  }
}