import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entity/usuario.entity';
import { ClientKafka } from '@nestjs/microservices';
import { TelegramService } from '../telegram/telegram.service'; // Adicionado

@Injectable()
export class UsuariosService {
    private readonly logger = new Logger(UsuariosService.name); // Adicionado Logger

    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
        private readonly telegramService: TelegramService, // Injete o TelegramService
    ) {}

    private async enviarTelegram(usuario: Usuario, mensagem: string) {
        if (!usuario || !usuario.telegramChatId) {
            this.logger.warn(`Usuário ${usuario?.id || 'desconhecido'} não possui telegramChatId. Mensagem de boas-vindas não será enviada.`);
            return;
        }
        await this.telegramService.enviarMensagem(usuario.telegramChatId.toString(), mensagem);
    }

    async findAll(): Promise<Usuario[]> {
        return this.usuarioRepository.find();
    }

    async findOne(id: number): Promise<Usuario> {
        const usuario = await this.usuarioRepository.findOneBy({ id });
        if (!usuario) {
            throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
        }
        return usuario;
    }

    async findByEmailWithPassword(email: string): Promise<Usuario | null> {
        const usuario = await this.usuarioRepository.findOne({
            where: { email },
            select: ['id', 'nome', 'email', 'senha', 'role', 'telegramChatId'],
        });
        return usuario;
    }

    async create(usuario: Partial<Usuario>): Promise<Usuario> {
        const novoUsuario = this.usuarioRepository.create(usuario);
        const usuarioSalvo = await this.usuarioRepository.save(novoUsuario);

        if (usuarioSalvo.telegramChatId) {
            // Envio DIRETO, eliminando o risco de timing do Kafka
            const mensagem = `Olá <b>${usuarioSalvo.nome}</b>, seu cadastro foi realizado com sucesso! :)`;
            await this.enviarTelegram(usuarioSalvo, mensagem);
            
            // O evento Kafka original foi removido: this.kafkaClient.emit('telegram.mensagem', {...})
        }

        return usuarioSalvo;
    }

    async update(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
        const usuarioExistente = await this.findOne(id);
        const campos = Object.fromEntries(Object.entries(usuario).filter(([_, v]) => v !== undefined));
        if (Object.keys(campos).length === 0) return usuarioExistente;
        Object.assign(usuarioExistente, campos);
        return this.usuarioRepository.save(usuarioExistente);
    }

    async remove(id: number): Promise<void> {
        const usuario = await this.findOne(id);
        await this.usuarioRepository.remove(usuario);
    }
}