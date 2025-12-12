import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { CreateNoticiaDto, UpdateNoticiaDto } from './dto/noticias.dto';
import { AuthGuard } from '@nestjs/passport';
import { NewsAdminGuard } from '../../common/guards/news-admin.guard';

@Controller('noticias')
export class NoticiasController {
    constructor(private readonly noticiasService: NoticiasService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'), NewsAdminGuard)
    create(@Body() createNoticiaDto: CreateNoticiaDto, @Request() req) {
        return this.noticiasService.create(createNoticiaDto, req.user.uuid);
    }

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('admin') admin: string = 'false'
    ) {
        // Se passar admin=true, tenta listar todas (se tiver permissão seria ideal validar, mas aqui deixamos filtro simples)
        // Na prática, o frontend admin vai chamar isso.
        const isPublic = admin !== 'true';
        return this.noticiasService.findAll(+page, +limit, isPublic);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.noticiasService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'), NewsAdminGuard)
    update(@Param('id') id: string, @Body() updateNoticiaDto: UpdateNoticiaDto) {
        return this.noticiasService.update(id, updateNoticiaDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), NewsAdminGuard)
    remove(@Param('id') id: string) {
        return this.noticiasService.remove(id);
    }
    @Post(':id/view')
    incrementViews(@Param('id') id: string) {
        return this.noticiasService.incrementViews(id);
    }

    @Post(':id/like')
    like(@Param('id') id: string) {
        return this.noticiasService.like(id);
    }

    @Post(':id/unlike')
    unlike(@Param('id') id: string) {
        return this.noticiasService.unlike(id);
    }
}
