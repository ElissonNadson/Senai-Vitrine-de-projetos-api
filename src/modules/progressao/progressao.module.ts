import { Module } from '@nestjs/common';
import { ProgressaoController } from './progressao.controller';
import { ProgressaoService } from './progressao.service';
import { ProgressaoDao } from './progressao.dao';
import { ProjetosModule } from '../projetos/projetos.module';

@Module({
  imports: [ProjetosModule],
  controllers: [ProgressaoController],
  providers: [ProgressaoService, ProgressaoDao],
  exports: [ProgressaoService],
})
export class ProgressaoModule {}
