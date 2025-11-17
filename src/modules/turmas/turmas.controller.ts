import { Controller, Get, Param, Query } from '@nestjs/common';
import { TurmasService } from './turmas.service';

@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  /**
   * GET /turmas
   * Lista turmas com filtros opcionais
   */
  @Get()
  async listarTurmas(
    @Query('cursoUuid') cursoUuid?: string,
    @Query('incluirInativas') incluirInativas?: string,
  ) {
    return this.turmasService.listarTurmas(
      cursoUuid,
      incluirInativas === 'true',
    );
  }

  /**
   * GET /turmas/:uuid
   * Busca turma por UUID
   */
  @Get(':uuid')
  async buscarTurma(
    @Param('uuid') uuid: string,
    @Query('incluirAlunos') incluirAlunos?: string,
  ) {
    return this.turmasService.buscarTurma(uuid, incluirAlunos === 'true');
  }

  /**
   * GET /turmas/codigo/:codigo
   * Busca turma por código
   */
  @Get('codigo/:codigo')
  async buscarPorCodigo(@Param('codigo') codigo: string) {
    return this.turmasService.buscarPorCodigo(codigo);
  }
}
