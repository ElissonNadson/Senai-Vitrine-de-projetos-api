import { Injectable, NotFoundException } from '@nestjs/common';
import { DepartamentosDao } from './departamentos.dao';

@Injectable()
export class DepartamentosService {
  constructor(private readonly departamentosDao: DepartamentosDao) {}

  /**
   * Lista todos os departamentos
   */
  async listarDepartamentos(incluirInativos: boolean = false): Promise<any[]> {
    const departamentos = await this.departamentosDao.listarDepartamentos(!incluirInativos);

    // Adiciona contagem de professores e projetos para cada departamento
    const departamentosComContagem = await Promise.all(
      departamentos.map(async (departamento) => {
        const totalProfessores = await this.departamentosDao.contarProfessoresPorDepartamento(
          departamento.uuid,
        );
        const totalProjetos = await this.departamentosDao.contarProjetosPorDepartamento(
          departamento.uuid,
        );
        return {
          ...departamento,
          total_professores: totalProfessores,
          total_projetos: totalProjetos,
        };
      }),
    );

    return departamentosComContagem;
  }

  /**
   * Busca departamento por UUID
   */
  async buscarDepartamento(uuid: string): Promise<any> {
    const departamento = await this.departamentosDao.buscarPorUuid(uuid);

    if (!departamento) {
      throw new NotFoundException('Departamento não encontrado');
    }

    const totalProfessores = await this.departamentosDao.contarProfessoresPorDepartamento(uuid);
    const totalProjetos = await this.departamentosDao.contarProjetosPorDepartamento(uuid);

    return {
      ...departamento,
      total_professores: totalProfessores,
      total_projetos: totalProjetos,
    };
  }

  /**
   * Busca departamento por sigla
   */
  async buscarPorSigla(sigla: string): Promise<any> {
    const departamento = await this.departamentosDao.buscarPorSigla(sigla);

    if (!departamento) {
      throw new NotFoundException('Departamento não encontrado');
    }

    return departamento;
  }
}
