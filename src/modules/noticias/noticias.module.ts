import { Module } from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { NoticiasController } from './noticias.controller';
import { DatabaseModule } from '../../common/database/database.module';
import { NoticiasSchedule } from './noticias.schedule';

@Module({
    imports: [DatabaseModule],
    controllers: [NoticiasController],
    providers: [NoticiasService, NoticiasSchedule],
})
export class NoticiasModule { }
