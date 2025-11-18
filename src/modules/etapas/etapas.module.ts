import { Module } from '@nestjs/common';
import { EtapasController } from './etapas.controller';
import { EtapasService } from './etapas.service';
import { EtapasDao } from './etapas.dao';
import { ProjetosModule } from '../projetos/projetos.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [ProjetosModule, UploadModule],
  controllers: [EtapasController],
  providers: [EtapasService, EtapasDao],
  exports: [EtapasService],
})
export class EtapasModule {}
