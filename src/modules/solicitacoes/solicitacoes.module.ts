import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { SolicitacoesController } from './solicitacoes.controller';
import { SolicitacoesService } from './solicitacoes.service';
import { SolicitacoesDao } from './solicitacoes.dao';

@Module({
  imports: [DatabaseModule, NotificacoesModule],
  controllers: [SolicitacoesController],
  providers: [SolicitacoesService, SolicitacoesDao],
  exports: [SolicitacoesService],
})
export class SolicitacoesModule {}
