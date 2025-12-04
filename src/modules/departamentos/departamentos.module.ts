import { Module } from '@nestjs/common';
import { DepartamentosController } from './departamentos.controller';
import { DepartamentosService } from './departamentos.service';
import { DepartamentosDao } from './departamentos.dao';

@Module({
  controllers: [DepartamentosController],
  providers: [DepartamentosService, DepartamentosDao],
  exports: [DepartamentosService],
})
export class DepartamentosModule {}
