import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class CursosDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) { }

  /**
   * Lista todos os cursos ativos
   */
  async listarCursos(apenasAtivos: boolean = true): Promise<any[]> {
    const query = apenasAtivos
      ? 'SELECT * FROM cursos WHERE ativo = TRUE ORDER BY nome'
      : 'SELECT * FROM cursos ORDER BY nome';

    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Busca curso por UUID
   */
  async buscarPorUuid(uuid: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM cursos WHERE uuid = $1',
      [uuid],
    );
    return result.rows[0] || null;
  }

  /**
   * Busca curso por sigla
   */
  async buscarPorSigla(sigla: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM cursos WHERE sigla = $1',
      [sigla],
    );
    return result.rows[0] || null;
  }

  /**
   * Lista turmas de um curso
   */
  async listarTurmasDoCurso(cursoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM turmas 
       WHERE curso_uuid = $1 AND ativa = TRUE
       ORDER BY ano DESC, semestre DESC`,
      [cursoUuid],
    );
    return result.rows;
  }

  /**
   * Conta alunos por curso
   */
  async contarAlunosPorCurso(cursoUuid: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as total FROM alunos WHERE curso_uuid = $1',
      [cursoUuid],
    );
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Lista unidades curriculares de um curso
   */
  async listarUnidadesDoCurso(cursoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM unidades_curriculares WHERE curso_uuid = $1 ORDER BY nome',
      [cursoUuid],
    );
    return result.rows;
  }
}
