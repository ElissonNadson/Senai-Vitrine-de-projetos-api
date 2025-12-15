import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) { }

  async use(req: Request, res: Response, next: NextFunction) {
    // Use originalUrl para pegar a URL completa (p.ex. com query string)
    const originalUrl = (req as any).originalUrl || req.url || req.path;

    const isAuthRoute =
      originalUrl === '/auth/login' || originalUrl.startsWith('/auth/google');

    // Rotas que permitem acesso opcional (com ou sem token)
    // /projetos/:uuid (GET) - permite visualizar projetos públicos sem login
    const path = originalUrl.split('?')[0];
    const isOptionalAuthRoute =
      req.method === 'GET' &&
      (
        /^\/projetos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(path) ||
        path.includes('/noticias')
      );

    const token = this.extractTokenFromHeader(req);

    // Se a rota é de autenticação, não requer validação de token
    if (isAuthRoute) {
      return next();
    }

    // Rotas com autenticação opcional - tenta extrair usuário se houver token
    if (isOptionalAuthRoute) {
      if (token && token !== process.env.SUPER_TOKEN) {
        try {
          await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET,
          });
          req['user'] = await this.jwtService.decode(token);
        } catch {
          // Token inválido, mas rota é opcional - continua sem usuário
        }
      }
      return next();
    }

    // Verificação para outras rotas que exigem autenticação
    if (!token) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    if (token === process.env.SUPER_TOKEN) {
      return next();
    }

    try {
      await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      req['user'] = await this.jwtService.decode(token);
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // Tenta obter o token de dois lugares: do cabeçalho Authorization ou do cookie
    const tokenFromCookie = request.cookies?.token || request.cookies?.accessToken;
    const authHeader = request.headers.authorization as string | undefined;
    let tokenFromHeader: string | undefined;

    if (authHeader) {
      // Suporta o formato "Bearer <token>"
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        tokenFromHeader = authHeader.slice(7).trim();
      } else {
        tokenFromHeader = authHeader;
      }
    }
    return tokenFromCookie ?? tokenFromHeader; // Retorna o token encontrado, seja do cookie ou do cabeçalho
  }
}
