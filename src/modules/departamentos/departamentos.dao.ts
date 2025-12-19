import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DepartamentosDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) { }

  /**
   * Lista todos os departamentos ativos
   */
  async listarDepartamentos(apenasAtivos: boolean = true): Promise<any[]> {
    const query = apenasAtivos
      ? 'SELECT * FROM departamentos WHERE ativo = TRUE ORDER BY nome'
      : 'SELECT * FROM departamentos ORDER BY nome';

    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Busca departamento por UUID
   */
  async buscarPorUuid(uuid: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM departamentos WHERE uuid = $1',
      [uuid],
    );
    return result.rows[0] || null;
  }

  /**
   * Busca departamento por sigla
   */
  async buscarPorSigla(sigla: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM departamentos WHERE sigla = $1',
      [sigla],
    );
    return result.rows[0] || null;
  }

  /**
   * Conta docentes por departamento
   */
  async contarDocentesPorDepartamento(departamentoUuid: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as total FROM docentes WHERE departamento_uuid = $1',
      [departamentoUuid],
    );
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Conta projetos por departamento
   */
  async contarProjetosPorDepartamento(departamentoUuid: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as total FROM projetos WHERE departamento_uuid = $1',
      [departamentoUuid],
    );
    return parseInt(result.rows[0].total, 10);
  }
}
