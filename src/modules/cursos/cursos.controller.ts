import { Controller, Get, Param, Query } from '@nestjs/common';
import { CursosService } from './cursos.service';

@Controller('cursos')
export class CursosController {
  constructor(private readonly cursosService: CursosService) { }

  /**
   * GET /cursos
   * Lista todos os cursos
   */
  @Get()
  async listarCursos(@Query('incluirInativos') incluirInativos?: string) {
    return this.cursosService.listarCursos(incluirInativos === 'true');
  }

  /**
   * GET /cursos/:uuid
   * Busca curso por UUID com turmas
   */
  @Get(':uuid')
  async buscarCurso(@Param('uuid') uuid: string) {
    return this.cursosService.buscarCurso(uuid);
  }

  /**
   * GET /cursos/sigla/:sigla
   * Busca curso por sigla
   */
  @Get('sigla/:sigla')
  async buscarPorSigla(@Param('sigla') sigla: string) {
    return this.cursosService.buscarPorSigla(sigla);
  }
  /**
   * GET /cursos/:uuid/unidades
   * Lista unidades curriculares de um curso
   */
  @Get(':uuid/unidades')
  async listarUnidades(@Param('uuid') uuid: string) {
    return this.cursosService.listarUnidades(uuid);
  }
}
