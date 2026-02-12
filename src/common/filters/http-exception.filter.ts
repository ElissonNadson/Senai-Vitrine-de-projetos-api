import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Filtro global de exceções HTTP
 * Formata erros no padrão da documentação
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log do erro
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status}`,
      exception.stack,
    );

    // Tratamento especial para callback do Google OAuth
    // Quando há erro de autenticação no callback, redireciona para frontend com erro
    if (
      request.url === '/auth/google/callback' &&
      exception instanceof UnauthorizedException
    ) {
      console.log('Erro de autenticação no callback:', exceptionResponse);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorMessage = this.extractMessage(exceptionResponse);

      const errorData = {
        message: errorMessage,
        error: 'Unauthorized',
        statusCode: status,
      };

      const encodedError = encodeURIComponent(JSON.stringify(errorData));
      return response.redirect(
        `${frontendUrl}/auth/google/callback?error=${encodedError}`,
      );
    }

    // Formato padrão de erro da documentação
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      mensagem: this.extractMessage(exceptionResponse),
      ...(typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : {}),
    };

    response.status(status).json(errorResponse);
  }

  private extractMessage(exceptionResponse: any): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (exceptionResponse?.message) {
      if (Array.isArray(exceptionResponse.message)) {
        return exceptionResponse.message.join(', ');
      }
      return exceptionResponse.message;
    }

    return 'Erro interno do servidor';
  }
}
