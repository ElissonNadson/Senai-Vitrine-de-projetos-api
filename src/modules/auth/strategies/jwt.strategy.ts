import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

/**
 * Extrai token do cookie ou do header Authorization
 */
const cookieOrHeaderExtractor = (request: Request): string | null => {
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

  return null;
};

/**
 * Estratégia JWT
 * Valida tokens JWT e retorna payload
 * Suporta token via Cookie ou Header Authorization
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: cookieOrHeaderExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: false,
    });
  }

  async validate(payload: any): Promise<JwtPayload> {
    if (!payload || !payload.uuid) {
      throw new UnauthorizedException('Token inválido');
    }

    // Retorna o payload que será anexado ao request.user
    return payload as JwtPayload;
  }
}
