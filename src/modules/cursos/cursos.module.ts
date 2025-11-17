import { Module } from '@nestjs/common';
import { CursosController } from './cursos.controller';
import { CursosService } from './cursos.service';
import { CursosDao } from './cursos.dao';

@Module({
  controllers: [CursosController],
  providers: [CursosService, CursosDao],
  exports: [CursosService],
})
export class CursosModule {}
