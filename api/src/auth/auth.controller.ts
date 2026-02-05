import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('cliente/register')
  async register(@Body() dto: RegisterDto) {
    const usuario = await this.authService.register(dto);

    return {
      message: 'Cliente cadastrado com sucesso!',
      id: usuario.id,
      nomeCompleto: usuario.nome,
      email: usuario.email,
    };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const usuario = await this.authService.validateUser(
      body.email,
      body.senha,
    );

    return this.authService.login(usuario);
  }
}

