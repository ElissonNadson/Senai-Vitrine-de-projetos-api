import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // 🟡 Erros de autenticação passam direto
        if (error instanceof UnauthorizedException) {
          return throwError(() => error);
        }

        const errorId = uuidv4();
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const logFilePath = path.join(process.cwd(), 'logs', `error_log_${date}.log`);

        const request = context.switchToHttp().getRequest();

        // Estrutura completa do erro para log
        const errorDetails = {
          errorId,
          message: error.message,
          timestamp: now.toISOString(),
          stack: error.stack,
          context: {
            method: request.method,
            url: request.url,
            body: request.body,
            ip: request.ip,
          },
        };

        // Garante diretório e grava log
        if (!fs.existsSync(path.dirname(logFilePath))) {
          fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
        }
        fs.appendFileSync(logFilePath, JSON.stringify(errorDetails, null, 2) + ',\n');

        // 🧩 CASO 1 — Erro de validação (Zod / Pipe)
        if (
          error instanceof BadRequestException &&
          error.getResponse &&
          typeof error.getResponse === 'function'
        ) {
          const res = error.getResponse() as any;
          if (res?.issues) {
            return throwError(
              () =>
                new HttpException(
                  {
                    success: false,
                    message: 'Falha na validação dos dados.',
                    errorId,
                    errors: res.issues, // devolve array [{ path, message }]
                  },
                  400,
                ),
            );
          }
        }

        // 🧩 CASO 2 — Erro Http conhecido (por exemplo, ForbiddenException, NotFoundException)
        if (error instanceof HttpException) {
          const status = error.getStatus();
          const response = error.getResponse();
          return throwError(
            () =>
              new HttpException(
                {
                  success: false,
                  message:
                    typeof response === 'string'
                      ? response
                      : (response as any)?.message || 'Erro HTTP',
                  errorId,
                },
                status,
              ),
          );
        }

        // 🧩 CASO 3 — Erro genérico inesperado
        return throwError(
          () =>
            new HttpException(
              {
                message: `Ocorreu um erro inesperado. Por favor, entre em contato com o suporte e forneça o seguinte código de erro: ${errorId}`,
                success: false,
              },
              500,
            ),
        );
      }),
    );
  }
}
