import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AdminProjetosDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async listarTodos(filters: {
    status?: string;
    fase_atual?: string;
    curso?: string;
    departamento_uuid?: string;
    busca?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.status) {
      conditions.push(`p.status = $${idx}`);
      params.push(filters.status);
      idx++;
    }
    if (filters.fase_atual) {
      conditions.push(`p.fase_atual = $${idx}`);
      params.push(filters.fase_atual);
      idx++;
    }
    if (filters.curso) {
      conditions.push(`p.curso ILIKE $${idx}`);
      params.push(`%${filters.curso}%`);
      idx++;
    }
    if (filters.departamento_uuid) {
      conditions.push(`p.departamento_uuid = $${idx}`);
      params.push(filters.departamento_uuid);
      idx++;
    }
    if (filters.busca) {
      conditions.push(`(p.titulo ILIKE $${idx} OR p.descricao ILIKE $${idx})`);
      params.push(`%${filters.busca}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const orderBy = filters.orderBy || 'p.criado_em';
    const orderDir = filters.orderDir || 'DESC';

    // Validar orderBy contra lista branca
    const allowedOrderBy = ['p.criado_em', 'p.titulo', 'p.fase_atual', 'p.status', 'p.curtidas_count', 'p.visualizacoes_count'];
    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'p.criado_em';
    const safeOrderDir = orderDir === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await this.pool.query(
      `SELECT COUNT(*) as total FROM projetos p ${where}`,
      params,
    );

    const result = await this.pool.query(
      `SELECT
        p.uuid, p.titulo, p.descricao, p.banner_url, p.fase_atual, p.status,
        p.curso, p.turma, p.modalidade, p.categoria, p.criado_em, p.data_publicacao,
        p.curtidas_count, p.visualizacoes_count,
        p.itinerario, p.senai_lab, p.saga_senai, p.participou_edital, p.ganhou_premio,
        d.nome as departamento_nome,
        (SELECT json_agg(json_build_object('uuid', u.uuid, 'nome', u.nome, 'email', u.email, 'papel', pa.papel))
         FROM projetos_alunos pa INNER JOIN usuarios u ON pa.usuario_uuid = u.uuid
         WHERE pa.projeto_uuid = p.uuid) as alunos,
        (SELECT json_agg(json_build_object('uuid', u.uuid, 'nome', u.nome, 'email', u.email, 'papel', pd2.papel))
         FROM projetos_docentes pd2 INNER JOIN usuarios u ON pd2.usuario_uuid = u.uuid
         WHERE pd2.projeto_uuid = p.uuid AND pd2.ativo = true) as docentes
       FROM projetos p
       LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
       ${where}
       ORDER BY ${safeOrderBy} ${safeOrderDir}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    return {
      projetos: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    };
  }

  async alterarStatus(projetoUuid: string, novoStatus: string, observacao?: string) {
    const result = await this.pool.query(
      `UPDATE projetos SET status = $1, atualizado_em = NOW()
       WHERE uuid = $2
       RETURNING uuid, titulo, status`,
      [novoStatus, projetoUuid],
    );
    return result.rows[0];
  }

  async alterarFase(projetoUuid: string, novaFase: string, adminUuid: string, observacao?: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const projetoResult = await client.query(
        `SELECT fase_atual FROM projetos WHERE uuid = $1`,
        [projetoUuid],
      );

      if (projetoResult.rows.length === 0) {
        throw new Error('Projeto não encontrado');
      }

      const faseAnterior = projetoResult.rows[0].fase_atual;

      await client.query(
        `UPDATE projetos SET fase_atual = $1, atualizado_em = NOW() WHERE uuid = $2`,
        [novaFase, projetoUuid],
      );

      await client.query(
        `INSERT INTO progressao_fases_log (projeto_uuid, fase_anterior, fase_nova, tipo_mudanca, usuario_uuid, observacao)
         VALUES ($1, $2, $3, 'MANUAL', $4, $5)`,
        [projetoUuid, faseAnterior, novaFase, adminUuid, observacao || 'Alteração manual pelo administrador'],
      );

      await client.query('COMMIT');

      return { uuid: projetoUuid, fase_anterior: faseAnterior, fase_nova: novaFase };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async removerIntegrante(projetoUuid: string, usuarioUuid: string) {
    // Tentar remover de alunos (projetos_alunos não tem coluna ativo)
    let result = await this.pool.query(
      `DELETE FROM projetos_alunos
       WHERE projeto_uuid = $1 AND usuario_uuid = $2
       RETURNING projeto_uuid, usuario_uuid, papel`,
      [projetoUuid, usuarioUuid],
    );

    if (result.rows.length > 0) {
      return { tipo: 'aluno', ...result.rows[0] };
    }

    // Tentar remover de docentes
    result = await this.pool.query(
      `UPDATE projetos_docentes SET ativo = false, removido_em = NOW()
       WHERE projeto_uuid = $1 AND usuario_uuid = $2 AND ativo = true
       RETURNING projeto_uuid, usuario_uuid, papel`,
      [projetoUuid, usuarioUuid],
    );

    if (result.rows.length > 0) {
      return { tipo: 'docente', ...result.rows[0] };
    }

    return null;
  }

  async alterarPapelIntegrante(projetoUuid: string, usuarioUuid: string, novoPapel: string) {
    // Tentar alterar em alunos (projetos_alunos não tem coluna ativo)
    let result = await this.pool.query(
      `UPDATE projetos_alunos SET papel = $1
       WHERE projeto_uuid = $2 AND usuario_uuid = $3
       RETURNING projeto_uuid, usuario_uuid, papel`,
      [novoPapel, projetoUuid, usuarioUuid],
    );

    if (result.rows.length > 0) {
      return { tipo: 'aluno', ...result.rows[0] };
    }

    // Tentar alterar em docentes
    result = await this.pool.query(
      `UPDATE projetos_docentes SET papel = $1
       WHERE projeto_uuid = $2 AND usuario_uuid = $3 AND ativo = true
       RETURNING projeto_uuid, usuario_uuid, papel`,
      [novoPapel, projetoUuid, usuarioUuid],
    );

    if (result.rows.length > 0) {
      return { tipo: 'docente', ...result.rows[0] };
    }

    return null;
  }

  async excluirProjeto(projetoUuid: string) {
    const result = await this.pool.query(
      `DELETE FROM projetos WHERE uuid = $1 RETURNING uuid, titulo`,
      [projetoUuid],
    );
    return result.rows[0];
  }
}
