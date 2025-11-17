import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class TurmasDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  /**
   * Lista turmas ativas
   */
  async listarTurmas(
    cursoUuid?: string,
    apenasAtivas: boolean = true,
  ): Promise<any[]> {
    let query = `
      SELECT t.*, c.nome as curso_nome, c.sigla as curso_sigla
      FROM turmas t
      INNER JOIN cursos c ON t.curso_uuid = c.uuid
    `;
    const params: any[] = [];

    if (cursoUuid) {
      params.push(cursoUuid);
      query += ` WHERE t.curso_uuid = $${params.length}`;
    }

    if (apenasAtivas) {
      query += cursoUuid ? ' AND t.ativa = TRUE' : ' WHERE t.ativa = TRUE';
    }

    query += ' ORDER BY t.ano DESC, t.semestre DESC, c.nome';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Busca turma por UUID
   */
  async buscarPorUuid(uuid: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT t.*, c.nome as curso_nome, c.sigla as curso_sigla
       FROM turmas t
       INNER JOIN cursos c ON t.curso_uuid = c.uuid
       WHERE t.uuid = $1`,
      [uuid],
    );
    return result.rows[0] || null;
  }

  /**
   * Busca turma por código
   */
  async buscarPorCodigo(codigo: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT t.*, c.nome as curso_nome, c.sigla as curso_sigla
       FROM turmas t
       INNER JOIN cursos c ON t.curso_uuid = c.uuid
       WHERE t.codigo = $1`,
      [codigo],
    );
    return result.rows[0] || null;
  }

  /**
   * Conta alunos por turma
   */
  async contarAlunosPorTurma(turmaUuid: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as total FROM alunos WHERE turma_uuid = $1',
      [turmaUuid],
    );
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Lista alunos de uma turma
   */
  async listarAlunosDaTurma(turmaUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT u.uuid, u.nome, u.email, u.avatar_url,
              a.matricula, a.telefone
       FROM alunos a
       INNER JOIN usuarios u ON a.usuario_uuid = u.uuid
       WHERE a.turma_uuid = $1 AND u.ativo = TRUE
       ORDER BY u.nome`,
      [turmaUuid],
    );
    return result.rows;
  }
}
