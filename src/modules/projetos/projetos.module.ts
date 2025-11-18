import { Module } from '@nestjs/common';
import { ProjetosController } from './projetos.controller';
import { ProjetosService } from './projetos.service';
import { ProjetosDao } from './projetos.dao';

@Module({
  imports: [],
  controllers: [ProjetosController],
  providers: [ProjetosService, ProjetosDao],
  exports: [ProjetosService],
})
export class ProjetosModule {}
