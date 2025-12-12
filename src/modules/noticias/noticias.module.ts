import { Module } from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { NoticiasController } from './noticias.controller';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [NoticiasController],
    providers: [NoticiasService],
})
export class NoticiasModule { }
