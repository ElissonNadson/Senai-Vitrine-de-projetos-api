import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private store: RateLimitStore = {};
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;

    // Cleanup a cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);

    const now = Date.now();
    const record = this.store[identifier];

    if (!record || now > record.resetTime) {
      // Nova janela de tempo
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return true;
    }

    if (record.count >= this.limit) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          mensagem: 'Muitas requisições. Tente novamente mais tarde.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    return true;
  }

  private getIdentifier(request: any): string {
    // Usa IP + User Agent como identificador
    const ip =
      request.ip ||
      request.connection.remoteAddress ||
      request.headers['x-forwarded-for'] ||
      'unknown';

    const userAgent = request.headers['user-agent'] || 'unknown';

    // Se autenticado, usa UUID do usuário
    if (request.user?.uuid) {
      return `user:${request.user.uuid}`;
    }

    return `ip:${ip}:${userAgent.substring(0, 50)}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}

/**
 * Rate limit para autenticação (mais restritivo)
 */
@Injectable()
export class AuthRateLimitGuard extends RateLimitGuard {
  constructor() {
    super(5, 60000); // 5 requisições por minuto
  }
}

/**
 * Rate limit para upload (moderado)
 */
@Injectable()
export class UploadRateLimitGuard extends RateLimitGuard {
  constructor() {
    super(20, 60000); // 20 uploads por minuto
  }
}

/**
 * Rate limit para API geral
 */
@Injectable()
export class ApiRateLimitGuard extends RateLimitGuard {
  constructor() {
    super(100, 60000); // 100 requisições por minuto
  }
}
