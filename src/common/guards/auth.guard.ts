import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Guard de autenticação JWT
 * Verifica se o usuário possui token válido
 * Suporta token via Cookie ou Header Authorization
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Adiciona payload ao request para uso nos controllers
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    return true;
  }

  /**
   * Extrai token do cookie ou do header Authorization
   */
  private extractToken(request: Request): string | undefined {
    // 1. Primeiro tenta do cookie
    const tokenFromCookie = request.cookies?.accessToken || request.cookies?.token;
    if (tokenFromCookie) {
      return tokenFromCookie;
    }

    // 2. Fallback para header Authorization: Bearer <token>
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.slice(7).trim();
    }

    return undefined;
  }
}
