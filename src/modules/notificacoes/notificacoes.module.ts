import { Module } from '@nestjs/common';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from './notificacoes.service';
import { NotificacoesDao } from './notificacoes.dao';

@Module({
  controllers: [NotificacoesController],
  providers: [NotificacoesService, NotificacoesDao],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
