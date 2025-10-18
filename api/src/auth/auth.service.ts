import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../entity/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string): Promise<Usuario> {
    const usuario = await this.usuariosService.findByEmailWithPassword(email);

    if (!usuario) throw new UnauthorizedException('Usuário não encontrado');

   
    const { senha: senhaHash, ...result } = usuario;

    const senhaValida = await bcrypt.compare(senha, senhaHash); 
    
    if (!senhaValida) throw new UnauthorizedException('Senha incorreta');

    return result as Usuario;
  }

  async login(usuario: Usuario) {
    const payload = { sub: usuario.id, email: usuario.email, role: usuario.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(nome: string, email: string, senha: string) {
    const hashSenha = await bcrypt.hash(senha, 10);
    return this.usuariosService.create({ nome, email, senha: hashSenha });
  }
}