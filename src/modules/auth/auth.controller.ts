import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RefreshTokenDto, GoogleUserDto } from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /auth/google
   * Inicia fluxo OAuth com Google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redireciona automaticamente para Google
  }

  /**
   * GET /auth/google/callback
   * Callback do Google OAuth
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const googleUser: GoogleUserDto = req.user;

    // Valida e cria/atualiza usuário
    const authResponse = await this.authService.validarCallback(googleUser);

    // Retorna token JWT (ou redireciona para frontend com token)
    if (process.env.NODE_ENV === 'production') {
      // Em produção, redireciona para frontend com token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(
        `${frontendUrl}/auth/callback?token=${authResponse.token}&primeiroAcesso=${authResponse.usuario.primeiroAcesso}`,
      );
    } else {
      // Em desenvolvimento, retorna JSON
      return res.status(HttpStatus.OK).json(authResponse);
    }
  }

  /**
   * GET /auth/me
   * Retorna dados do usuário logado
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.obterUsuarioAtual(user.uuid);
  }

  /**
   * POST /auth/refresh
   * Renova token JWT
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.renovarToken(refreshTokenDto.token);
  }

  /**
   * POST /auth/logout
   * Logout (invalida cookies)
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res() res: Response) {
    const result = await this.authService.logout(res);
    return res.json(result);
  }
}
