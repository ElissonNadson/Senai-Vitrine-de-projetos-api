import { Injectable, NotFoundException } from '@nestjs/common';
import { TurmasDao } from './turmas.dao';

@Injectable()
export class TurmasService {
  constructor(private readonly turmasDao: TurmasDao) {}

  /**
   * Lista turmas com filtros
   */
  async listarTurmas(
    cursoUuid?: string,
    incluirInativas: boolean = false,
  ): Promise<any[]> {
    const turmas = await this.turmasDao.listarTurmas(
      cursoUuid,
      !incluirInativas,
    );

    // Adiciona contagem de alunos
    const turmasComContagem = await Promise.all(
      turmas.map(async (turma) => {
        const totalAlunos = await this.turmasDao.contarAlunosPorTurma(
          turma.uuid,
        );
        return {
          ...turma,
          total_alunos: totalAlunos,
        };
      }),
    );

    return turmasComContagem;
  }

  /**
   * Busca turma por UUID com alunos
   */
  async buscarTurma(uuid: string, incluirAlunos: boolean = false): Promise<any> {
    const turma = await this.turmasDao.buscarPorUuid(uuid);

    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    const totalAlunos = await this.turmasDao.contarAlunosPorTurma(uuid);
    
    const resultado: any = {
      ...turma,
      total_alunos: totalAlunos,
    };

    if (incluirAlunos) {
      resultado.alunos = await this.turmasDao.listarAlunosDaTurma(uuid);
    }

    return resultado;
  }

  /**
   * Busca turma por código
   */
  async buscarPorCodigo(codigo: string): Promise<any> {
    const turma = await this.turmasDao.buscarPorCodigo(codigo);

    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    return turma;
  }
}
