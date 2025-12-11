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
import { AuthRateLimitGuard } from '../../common/guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * GET /auth/google
   * Inicia fluxo OAuth com Google
   */
  @Get('google')
  @UseGuards(AuthRateLimitGuard, AuthGuard('google'))
  async googleAuth() {
    // Redireciona para Google
  }

  /**
   * GET /auth/google/callback
   * Callback do Google OAuth
   */
  @Get('google/callback')
  @UseGuards(AuthRateLimitGuard, AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res) {
    const googleUser: GoogleUserDto = req.user;

    // Extrai IP e User-Agent para rastreamento de sessão
    const ip =
      req.ip ||
      req.connection?.remoteAddress ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Valida e cria/atualiza usuário (com dados de sessão)
    const authResponse = await this.authService.validarCallback(
      googleUser,
      ip,
      userAgent,
    );

    // Prepara dados completos para o frontend
    const userData = {
      accessToken: authResponse.token,
      usuariosEntity: {
        uuid: authResponse.usuario.uuid,
        nome: authResponse.usuario.nome,
        email: authResponse.usuario.email,
        tipo: authResponse.usuario.tipo,
        avatarUrl: authResponse.usuario.avatarUrl,
        primeiroAcesso: authResponse.usuario.primeiroAcesso,
      },
    };

    res.cookie('token', authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Sempre redireciona para frontend com dados codificados
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const encodedData = encodeURIComponent(JSON.stringify(userData));
    return res.redirect(
      `${frontendUrl}/auth/google/callback?data=${encodedData}`,
    );
  }

  /**
   * GET /auth/me
   * Retorna dados do usuário logado
   */
  @Get('me')
  // @UseGuards(AuthGuard('jwt'))
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.obterUsuarioAtual(user.uuid);
  }

  /**
   * POST /auth/refresh
   * Renova token JWT
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Res() res: Response) {
    const result = await this.authService.renovarToken(refreshTokenDto.token);

    // Emite novo token no cookie padronizado "token"
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Compatibilidade: opcionalmente remove cookie legado se existir
    res.clearCookie('accessToken');

    return res.json(result);
  }

  /**
   * POST /auth/logout
   * Logout (invalida cookies e encerra sessão)
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res() res: Response) {
    // Extrai token para encerrar sessão
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    const result = await this.authService.logout(res, token);

    // Compatibilidade: garante remoção do cookie legado
    res.clearCookie('accessToken');
    return res.json(result);
  }
}
