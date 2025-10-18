import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const usuario = await this.authService.validateUser(body.email, body.senha);
    return this.authService.login(usuario);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const usuario = await this.authService.register(body.nome, body.email, body.senha);
    return { id: usuario.id, nome: usuario.nome, email: usuario.email };
  }
}

