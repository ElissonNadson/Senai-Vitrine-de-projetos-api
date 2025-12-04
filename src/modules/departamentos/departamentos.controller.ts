import { Controller, Get, Param, Query } from '@nestjs/common';
import { DepartamentosService } from './departamentos.service';

@Controller('departamentos')
export class DepartamentosController {
  constructor(private readonly departamentosService: DepartamentosService) {}

  /**
   * GET /departamentos
   * Lista todos os departamentos
   */
  @Get()
  async listarDepartamentos(@Query('incluirInativos') incluirInativos?: string) {
    return this.departamentosService.listarDepartamentos(incluirInativos === 'true');
  }

  /**
   * GET /departamentos/:uuid
   * Busca departamento por UUID
   */
  @Get(':uuid')
  async buscarDepartamento(@Param('uuid') uuid: string) {
    return this.departamentosService.buscarDepartamento(uuid);
  }

  /**
   * GET /departamentos/sigla/:sigla
   * Busca departamento por sigla
   */
  @Get('sigla/:sigla')
  async buscarPorSigla(@Param('sigla') sigla: string) {
    return this.departamentosService.buscarPorSigla(sigla);
  }
}
