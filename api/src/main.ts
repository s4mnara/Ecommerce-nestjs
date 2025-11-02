import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as express from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { rawBody: true }); 

    app.enableCors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });

    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (req.originalUrl.startsWith('/pagamentos/webhook')) {
            next();
        } else {
            express.json()(req, res, next);
        }
    });

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: {
                brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
            },
            consumer: {
                groupId: 'loja-consumer',
            },
        },
    });

    await app.startAllMicroservices();
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
    console.log(`API rodando na porta ${process.env.PORT ?? 3000}`);
}

bootstrap();

