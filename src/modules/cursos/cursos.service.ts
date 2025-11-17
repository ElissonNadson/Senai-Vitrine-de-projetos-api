import { Injectable, NotFoundException } from '@nestjs/common';
import { CursosDao } from './cursos.dao';

@Injectable()
export class CursosService {
  constructor(private readonly cursosDao: CursosDao) {}

  /**
   * Lista todos os cursos
   */
  async listarCursos(incluirInativos: boolean = false): Promise<any[]> {
    const cursos = await this.cursosDao.listarCursos(!incluirInativos);

    // Adiciona contagem de alunos para cada curso
    const cursosComContagem = await Promise.all(
      cursos.map(async (curso) => {
        const totalAlunos = await this.cursosDao.contarAlunosPorCurso(
          curso.uuid,
        );
        return {
          ...curso,
          total_alunos: totalAlunos,
        };
      }),
    );

    return cursosComContagem;
  }

  /**
   * Busca curso por UUID com turmas
   */
  async buscarCurso(uuid: string): Promise<any> {
    const curso = await this.cursosDao.buscarPorUuid(uuid);

    if (!curso) {
      throw new NotFoundException('Curso não encontrado');
    }

    const turmas = await this.cursosDao.listarTurmasDoCurso(uuid);
    const totalAlunos = await this.cursosDao.contarAlunosPorCurso(uuid);

    return {
      ...curso,
      turmas,
      total_alunos: totalAlunos,
    };
  }

  /**
   * Busca curso por sigla
   */
  async buscarPorSigla(sigla: string): Promise<any> {
    const curso = await this.cursosDao.buscarPorSigla(sigla);

    if (!curso) {
      throw new NotFoundException('Curso não encontrado');
    }

    return curso;
  }
}
