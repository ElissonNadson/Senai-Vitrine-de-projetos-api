import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SessoesController } from './sessoes.controller';
import { SessoesService } from './sessoes.service';
import { SessoesDAO } from './sessoes.dao';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    NotificacoesModule,
    forwardRef(() => AuthModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-change-me',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SessoesController],
  providers: [SessoesService, SessoesDAO],
  exports: [SessoesService],
})
export class SessoesModule {}
