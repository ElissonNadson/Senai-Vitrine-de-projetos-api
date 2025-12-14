
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NoticiasService } from './noticias.service';

@Injectable()
export class NoticiasSchedule {
  private readonly logger = new Logger(NoticiasSchedule.name);

  constructor(private readonly noticiasService: NoticiasService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleAutoArchive() {
    this.logger.log('Executando tarefa de arquivamento automático de notícias antigas...');
    try {
      const archived = await this.noticiasService.archiveOldNews();
      if (archived.length > 0) {
        this.logger.log(`${archived.length} notícias foram arquivadas automaticamente.`);
      } else {
        this.logger.log('Nenhuma notícia para arquivar hoje.');
      }
    } catch (error) {
      this.logger.error('Erro ao executar arquivamento automático', error);
    }
  }
}
