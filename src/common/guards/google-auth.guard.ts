import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

/**
 * Guard customizado para Google OAuth
 * Captura erros do Passport Strategy e redireciona para frontend
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const response = context.switchToHttp().getResponse<Response>();

    if (err) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      // Extrai mensagem de erro
      let errorMessage = 'Erro na autenticação';

      // Se err é uma exceção NestJS, extrai a mensagem
      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.response?.message) {
        // Pode estar em err.response.message
        errorMessage = Array.isArray(err.response.message)
          ? err.response.message.join(', ')
          : err.response.message;
      }

      const errorData = {
        message: errorMessage,
        error: 'Unauthorized',
        statusCode: 401,
      };

      const encodedError = encodeURIComponent(JSON.stringify(errorData));

      // Redireciona para frontend com erro
      return response.redirect(
        `${frontendUrl}/auth/google/callback?error=${encodedError}`,
      );
    }

    // Se há info mas não há erro, pode ser uma falha de autenticação do Passport
    if (info && !user) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      let errorMessage = 'Erro na autenticação';
      if (info.message) {
        errorMessage = info.message;
      } else if (typeof info === 'string') {
        errorMessage = info;
      }

      const errorData = {
        message: errorMessage,
        error: 'Unauthorized',
        statusCode: 401,
      };

      const encodedError = encodeURIComponent(JSON.stringify(errorData));

      return response.redirect(
        `${frontendUrl}/auth/google/callback?error=${encodedError}`,
      );
    }

    if (!user) {
      return super.handleRequest(err, user, info, context);
    }

    // Se tudo está OK, retorna o usuário
    return user;
  }
}
