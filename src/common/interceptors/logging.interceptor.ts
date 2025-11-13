import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment-timezone';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logFilePath = path.join(process.cwd(), 'access', 'rest.log');

  constructor() {
    // Verifica se o diretório de logs existe, caso contrário, cria-o
    const logDirectory = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Verifica se o contexto é HTTP
    if (!context.switchToHttp().getRequest()) {
      return next.handle(); // Ignora se não for contexto HTTP
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body, params, query, headers } = request;

    if (url === '/auth/login') {
      return next.handle();
    }

    // Decodifica os dados do token Bearer, se estiver presente
    let tokenData = {};
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        tokenData = jwt.decode(token) || {}; // decodifica o token sem verificar a assinatura
      } catch (error) {
        console.error('Erro ao decodificar o token:', error);
      }
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async () => {
        const responseTime = Date.now() - startTime;

        const logData = {
          timestamp: moment().tz('America/Sao_Paulo').format(),
          clientIp: ip,
          method,
          url,
          params: { ...params, ...tokenData },
          query,
          body,
          responseTime: `${responseTime} ms`,
        };

        const logMessage = JSON.stringify(logData, null, 2) + ',\n';

        // Salva o log no arquivo
        try {
          await fs.promises.appendFile(this.logFilePath, logMessage, 'utf8');
        } catch (error) {
          console.error('Erro ao gravar no arquivo de log:', error);
        }
      })
    );
  }
}
