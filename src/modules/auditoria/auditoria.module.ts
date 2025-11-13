import { DatabaseModule } from '../../common/database/database.module';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaDao } from './auditoria.dao';
import { Module } from '@nestjs/common';

@Module({
  providers: [AuditoriaService, AuditoriaDao],
  controllers: [AuditoriaController],
  imports: [DatabaseModule],
  exports: [AuditoriaService, AuditoriaDao],
})
export class AuditoriaModule { }
