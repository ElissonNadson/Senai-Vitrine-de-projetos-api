import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/common/database/database.module';
import { ProjetosArquivadosController } from './projetos-arquivados.controller';
import { ProjetosArquivadosService } from './projetos-arquivados.service';
import { ProjetosArquivadosDao } from './projetos-arquivados.dao';

@Module({
  imports: [DatabaseModule],
  controllers: [ProjetosArquivadosController],
  providers: [ProjetosArquivadosService, ProjetosArquivadosDao],
  exports: [ProjetosArquivadosService, ProjetosArquivadosDao],
})
export class ProjetosArquivadosModule {}
