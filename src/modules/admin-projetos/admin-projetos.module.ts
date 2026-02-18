import { Module } from '@nestjs/common';
import { AdminProjetosController } from './admin-projetos.controller';
import { AdminProjetosService } from './admin-projetos.service';
import { AdminProjetosDao } from './admin-projetos.dao';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminProjetosController],
  providers: [AdminProjetosService, AdminProjetosDao],
})
export class AdminProjetosModule {}
