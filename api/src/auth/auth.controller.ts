import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfirmarEmailDto } from './dto/confirmar-email.dto';
import { ReenviarCodigoDto } from './dto/reenviar-codigo.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

@Post('cliente/register')
@Post('register')
async register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const usuario = await this.authService.validateUser(
      body.email,
      body.senha,
    );

    return this.authService.login(usuario);
  }

    @Post('confirmar-email')
  confirmarEmail(@Body() dto: ConfirmarEmailDto) {
    return this.authService.confirmarEmail(dto);
  }

  @Post('reenviar-codigo')
reenviarCodigo(@Body() dto: ReenviarCodigoDto) {
  return this.authService.reenviarCodigo(dto);
}


}

