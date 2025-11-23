import { ErrorLoggingInterceptor } from './common/interceptors/error.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
const expressSanitizer = require('express-sanitizer');
import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import * as cors from 'cors';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true, // Permite cookies e credenciais
  }));
  app.use(cookieParser()); // <-- habilita cookies

  app.useGlobalInterceptors(new ErrorLoggingInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.use(helmet({
    frameguard: { action: 'sameorigin' },
    hsts: { maxAge: 15552000, includeSubDomains: true },
    noSniff: true,
    ieNoOpen: true,
    referrerPolicy: { policy: 'no-referrer' },
    hidePoweredBy: true
  }));

  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "trusted-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  }));

  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.set('trust proxy', 1);

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Limite de 100 requisições por IP por "windowMs"
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Envia informações de rate limit nos headers `RateLimit-*`
    legacyHeaders: false, // Desativa os headers `X-RateLimit-*`
  });

  app.use(expressSanitizer());

  // Aplica o limitador
  app.use(limiter);

  app.use(helmet.dnsPrefetchControl({ allow: false }));

  await app.listen(process.env.PORT ?? 3000).then(() => {
    console.log(`Servidor rodando na porta ${process.env.PORT ?? 3000}`);
  });
}
bootstrap();
