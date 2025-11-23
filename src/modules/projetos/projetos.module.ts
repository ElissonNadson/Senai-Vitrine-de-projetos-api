import { DatabaseModule } from 'src/common/database/database.module';
import { ProjetosController } from './projetos.controller';
import { ProjetosService } from './projetos.service';
import { ProjetosDao } from './projetos.dao';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule],
  controllers: [ProjetosController],
  providers: [ProjetosService, ProjetosDao],
  exports: [ProjetosService, ProjetosDao],
})
export class ProjetosModule {}
