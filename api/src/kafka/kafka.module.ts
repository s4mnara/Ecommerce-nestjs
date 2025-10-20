import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaConsumer } from './kafka.consumer';
import { Usuario } from '../entity/usuario.entity';
import { TelegramModule } from '../telegram/telegram.module'; 
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        TelegramModule,
        TypeOrmModule.forFeature([Usuario]),
        ConfigModule,

        ClientsModule.registerAsync([
            {
                name: 'KAFKA_SERVICE',
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: 'ecommerce-producer',
                            brokers: [configService.get<string>('KAFKA_BROKER')!],
                            retry: {
                                initialRetryTime: 300, 
                                retries: 5,
                            }
                        },
                        producer: {
                            allowAutoTopicCreation: true,
                        }
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    providers: [KafkaConsumer],
    exports: [ClientsModule],
})
export class KafkaModule {}