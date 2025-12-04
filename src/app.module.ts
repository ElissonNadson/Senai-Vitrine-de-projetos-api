import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from './common/middlewares/auth.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { PerfilModule } from './modules/perfil/perfil.module';
import { CursosModule } from './modules/cursos/cursos.module';
import { TurmasModule } from './modules/turmas/turmas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProjetosModule } from './modules/projetos/projetos.module';
import { UploadModule } from './modules/upload/upload.module';
import { EtapasModule } from './modules/etapas/etapas.module';
import { ProgressaoModule } from './modules/progressao/progressao.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import * as cookieParser from 'cookie-parser';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 10,
        backoff: {
          type: 'fixed',
          // type: 'exponential',
          delay: 1000,
        },
      },
    }),
    AuthModule,
    PerfilModule,
    CursosModule,
    TurmasModule,
    DashboardModule,
    ProjetosModule,
    UploadModule,
    EtapasModule,
    ProgressaoModule,
    NotificacoesModule,
    JwtModule
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/google', method: RequestMethod.POST },
        { path: 'projetos', method: RequestMethod.GET },
        { path: 'cursos', method: RequestMethod.GET },
        { path: 'cursos/(.*)', method: RequestMethod.GET },
        { path: 'turmas', method: RequestMethod.GET },
        { path: 'turmas/(.*)', method: RequestMethod.GET },
      )
      .forRoutes('*');

    consumer
      .apply(cookieParser())
      .forRoutes('*');
  }
}
