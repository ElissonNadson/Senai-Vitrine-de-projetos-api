import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Decorator que extrai e decodifica o token JWT armazenado no cookie "token".
 * Retorna o payload do usuário autenticado.
 */
export const UserFromCookie = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.cookies?.token;

    if (!token) {
      throw new UnauthorizedException('Token não encontrado no cookie.');
    }

    try {
      // Como não podemos injetar serviços diretamente aqui,
      // criamos uma instância do JwtService manualmente.
      const jwtService = new JwtService({
        secret: process.env.JWT_SECRET,
      });

      const decoded = jwtService.verify(token);
      return decoded; // 👈 retorna o payload do token
    } catch (err) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  },
);
