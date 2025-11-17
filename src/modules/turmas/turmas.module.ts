import { Module } from '@nestjs/common';
import { TurmasController } from './turmas.controller';
import { TurmasService } from './turmas.service';
import { TurmasDao } from './turmas.dao';

@Module({
  controllers: [TurmasController],
  providers: [TurmasService, TurmasDao],
  exports: [TurmasService],
})
export class TurmasModule {}
