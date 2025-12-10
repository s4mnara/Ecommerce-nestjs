import { Injectable, NestMiddleware } from '@nestjs/common';
import { LogsService } from './logs.service';

@Injectable()
export class LogsMiddleware implements NestMiddleware {
  constructor(private logsService: LogsService) {}

  async use(req: any, res: any, next: () => void) {
    const rota = req.originalUrl;
    const metodo = req.method;
    const ip = req.ip;

    // Salva log depois da resposta terminar
    res.on('finish', async () => {
      const usuarioId = req.user?.id || null; // caso venha do JWT

      await this.logsService.registrarLog({
        usuarioId,
        acao: `${metodo} ${rota}`,
        detalhes: { status: res.statusCode },
        rota,
        metodo,
        ip,
      });
    });

    next();
  }
}
