import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { ReportFilters, buildWhereClause } from './dto/report-filters.dto';

@Injectable()
export class AdminReportsDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async getOverview(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT
        (SELECT COUNT(*) FROM projetos p WHERE p.status != 'RASCUNHO' ${where}) as total_projetos,
        (SELECT COUNT(*) FROM usuarios WHERE tipo = 'ALUNO' AND ativo = true) as total_alunos,
        (SELECT COUNT(*) FROM usuarios WHERE tipo = 'DOCENTE' AND ativo = true) as total_docentes,
        (SELECT COUNT(*) FROM cursos WHERE ativo = true) as total_cursos,
        (SELECT COUNT(*) FROM departamentos) as total_departamentos,
        (SELECT COUNT(*) FROM projetos p WHERE p.itinerario = true ${where}) as total_itinerario,
        (SELECT COUNT(*) FROM projetos p WHERE p.senai_lab = true ${where}) as total_senai_lab,
        (SELECT COUNT(*) FROM projetos p WHERE p.saga_senai = true ${where}) as total_saga,
        (SELECT COUNT(*) FROM projetos p WHERE p.participou_edital = true ${where}) as total_editais,
        (SELECT COUNT(*) FROM projetos p WHERE p.ganhou_premio = true ${where}) as total_premiacoes
      `,
      [...params, ...params, ...params, ...params, ...params, ...params],
    );

    const stats = result.rows[0];
    const total = parseInt(stats.total_projetos) || 1;

    return {
      ...stats,
      taxa_itinerario: ((parseInt(stats.total_itinerario) / total) * 100).toFixed(1),
      taxa_senai_lab: ((parseInt(stats.total_senai_lab) / total) * 100).toFixed(1),
      taxa_saga: ((parseInt(stats.total_saga) / total) * 100).toFixed(1),
      taxa_editais: ((parseInt(stats.total_editais) / total) * 100).toFixed(1),
      taxa_premiacoes: ((parseInt(stats.total_premiacoes) / total) * 100).toFixed(1),
    };
  }

  async getProjetosPorCurso(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `WHERE p.status != 'RASCUNHO' AND ${conditions.join(' AND ')}` : `WHERE p.status != 'RASCUNHO'`;

    const result = await this.pool.query(
      `SELECT p.curso as nome, COUNT(*) as total
       FROM projetos p
       ${where}
       AND p.curso IS NOT NULL AND p.curso != ''
       GROUP BY p.curso
       ORDER BY total DESC`,
      params,
    );
    return result.rows;
  }

  async getProjetosPorModalidade(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `WHERE p.status != 'RASCUNHO' AND ${conditions.join(' AND ')}` : `WHERE p.status != 'RASCUNHO'`;

    const result = await this.pool.query(
      `SELECT COALESCE(p.modalidade, 'Não informada') as nome, COUNT(*) as total
       FROM projetos p
       ${where}
       GROUP BY p.modalidade
       ORDER BY total DESC`,
      params,
    );
    return result.rows;
  }

  async getProjetosPorUnidadeCurricular(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `WHERE p.status != 'RASCUNHO' AND ${conditions.join(' AND ')}` : `WHERE p.status != 'RASCUNHO'`;

    const result = await this.pool.query(
      `SELECT COALESCE(p.unidade_curricular, 'Não informada') as nome, COUNT(*) as total
       FROM projetos p
       ${where}
       GROUP BY p.unidade_curricular
       ORDER BY total DESC`,
      params,
    );
    return result.rows;
  }

  async getProjetosPorTurma(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `WHERE p.status != 'RASCUNHO' AND ${conditions.join(' AND ')}` : `WHERE p.status != 'RASCUNHO'`;

    const result = await this.pool.query(
      `SELECT COALESCE(p.turma, 'Não informada') as nome, COUNT(*) as total
       FROM projetos p
       ${where}
       GROUP BY p.turma
       ORDER BY total DESC`,
      params,
    );
    return result.rows;
  }

  async getDistribuicaoFases(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `WHERE p.status != 'RASCUNHO' AND ${conditions.join(' AND ')}` : `WHERE p.status != 'RASCUNHO'`;

    const result = await this.pool.query(
      `SELECT
        p.fase_atual as fase,
        COUNT(*) as total,
        ROUND(COUNT(*)::numeric * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) as percentual
       FROM projetos p
       ${where}
       GROUP BY p.fase_atual
       ORDER BY
        CASE p.fase_atual
          WHEN 'IDEACAO' THEN 1
          WHEN 'MODELAGEM' THEN 2
          WHEN 'PROTOTIPAGEM' THEN 3
          WHEN 'IMPLEMENTACAO' THEN 4
          ELSE 5
        END`,
      params,
    );
    return result.rows;
  }

  async getTaxaAvancoFases(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters, 'p');
    const where = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT
        pfl.fase_anterior,
        pfl.fase_nova,
        COUNT(*) as total_transicoes,
        pfl.tipo_mudanca
       FROM progressao_fases_log pfl
       INNER JOIN projetos p ON pfl.projeto_uuid = p.uuid
       WHERE 1=1 ${where}
       GROUP BY pfl.fase_anterior, pfl.fase_nova, pfl.tipo_mudanca
       ORDER BY
        CASE pfl.fase_anterior
          WHEN 'IDEACAO' THEN 1
          WHEN 'MODELAGEM' THEN 2
          WHEN 'PROTOTIPAGEM' THEN 3
          WHEN 'IMPLEMENTACAO' THEN 4
          ELSE 5
        END`,
      params,
    );
    return result.rows;
  }

  async getProjetosPorDocente(filters: ReportFilters, limit = 10) {
    const { conditions, params, paramIndex } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT
        u.nome,
        u.email,
        d.nome as departamento,
        COUNT(DISTINCT pd.projeto_uuid) as total_projetos,
        COUNT(DISTINCT CASE WHEN p.fase_atual = 'IMPLEMENTACAO' THEN pd.projeto_uuid END) as projetos_concluidos,
        COUNT(DISTINCT CASE WHEN p.status = 'PUBLICADO' THEN pd.projeto_uuid END) as projetos_ativos
       FROM projetos_docentes pd
       INNER JOIN usuarios u ON pd.usuario_uuid = u.uuid
       INNER JOIN projetos p ON pd.projeto_uuid = p.uuid
       LEFT JOIN docentes doc ON doc.usuario_uuid = u.uuid
       LEFT JOIN departamentos d ON doc.departamento_uuid = d.uuid
       WHERE pd.papel = 'ORIENTADOR' AND pd.ativo = true
       AND p.status != 'RASCUNHO' ${where}
       GROUP BY u.uuid, u.nome, u.email, d.nome
       ORDER BY total_projetos DESC
       LIMIT $${paramIndex}`,
      [...params, limit],
    );
    return result.rows;
  }

  async getTaxaParticipacao(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `WHERE p.status != 'RASCUNHO' AND ${conditions.join(' AND ')}` : `WHERE p.status != 'RASCUNHO'`;

    const result = await this.pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE p.itinerario = true) as itinerario,
        COUNT(*) FILTER (WHERE p.senai_lab = true) as senai_lab,
        COUNT(*) FILTER (WHERE p.saga_senai = true) as saga_senai,
        COUNT(*) FILTER (WHERE p.participou_edital = true) as participou_edital,
        COUNT(*) FILTER (WHERE p.ganhou_premio = true) as ganhou_premio,
        ROUND(COUNT(*) FILTER (WHERE p.itinerario = true)::numeric * 100.0 / NULLIF(COUNT(*), 0), 1) as taxa_itinerario,
        ROUND(COUNT(*) FILTER (WHERE p.senai_lab = true)::numeric * 100.0 / NULLIF(COUNT(*), 0), 1) as taxa_senai_lab,
        ROUND(COUNT(*) FILTER (WHERE p.saga_senai = true)::numeric * 100.0 / NULLIF(COUNT(*), 0), 1) as taxa_saga,
        ROUND(COUNT(*) FILTER (WHERE p.participou_edital = true)::numeric * 100.0 / NULLIF(COUNT(*), 0), 1) as taxa_editais,
        ROUND(COUNT(*) FILTER (WHERE p.ganhou_premio = true)::numeric * 100.0 / NULLIF(COUNT(*), 0), 1) as taxa_premiacao
       FROM projetos p
       ${where}`,
      params,
    );
    return result.rows[0];
  }

  async getSenaiLabPorFase(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `WHERE p.status != 'RASCUNHO' AND ${conditions.join(' AND ')}` : `WHERE p.status != 'RASCUNHO'`;

    const result = await this.pool.query(
      `SELECT
        p.fase_atual as fase,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE p.senai_lab = true) as com_lab,
        ROUND(COUNT(*) FILTER (WHERE p.senai_lab = true)::numeric * 100.0 / NULLIF(COUNT(*), 0), 1) as percentual_lab
       FROM projetos p
       ${where}
       GROUP BY p.fase_atual
       ORDER BY
        CASE p.fase_atual
          WHEN 'IDEACAO' THEN 1
          WHEN 'MODELAGEM' THEN 2
          WHEN 'PROTOTIPAGEM' THEN 3
          WHEN 'IMPLEMENTACAO' THEN 4
          ELSE 5
        END`,
      params,
    );
    return result.rows;
  }

  async getTimelineCriacao(filters: ReportFilters, agrupamento: 'mensal' | 'semanal' = 'mensal') {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `WHERE p.status != 'RASCUNHO' AND ${conditions.join(' AND ')}` : `WHERE p.status != 'RASCUNHO'`;

    const dateFormat = agrupamento === 'semanal' ? 'IYYY-IW' : 'YYYY-MM';
    const dateTrunc = agrupamento === 'semanal' ? 'week' : 'month';

    const result = await this.pool.query(
      `SELECT
        TO_CHAR(DATE_TRUNC('${dateTrunc}', p.criado_em), '${dateFormat}') as periodo,
        DATE_TRUNC('${dateTrunc}', p.criado_em) as data_inicio,
        COUNT(*) as total
       FROM projetos p
       ${where}
       GROUP BY periodo, data_inicio
       ORDER BY data_inicio`,
      params,
    );
    return result.rows;
  }

  async getComportamentoOrientadores(filters: ReportFilters) {
    const { conditions, params } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT
        u.nome,
        u.email,
        dep.nome as departamento,
        COUNT(DISTINCT pd.projeto_uuid) as total_projetos,
        COUNT(DISTINCT CASE WHEN p.status = 'PUBLICADO' THEN pd.projeto_uuid END) as projetos_ativos,
        COUNT(DISTINCT CASE WHEN p.fase_atual = 'IMPLEMENTACAO' THEN pd.projeto_uuid END) as projetos_concluidos,
        ROUND(
          COUNT(DISTINCT CASE WHEN p.fase_atual = 'IMPLEMENTACAO' THEN pd.projeto_uuid END)::numeric * 100.0 /
          NULLIF(COUNT(DISTINCT pd.projeto_uuid), 0), 1
        ) as taxa_conclusao,
        MIN(pd.adicionado_em) as primeira_orientacao,
        MAX(pd.adicionado_em) as ultima_orientacao,
        AVG(
          EXTRACT(EPOCH FROM (COALESCE(p.atualizado_em, NOW()) - p.criado_em)) / 86400
        )::int as media_dias_projeto
       FROM projetos_docentes pd
       INNER JOIN usuarios u ON pd.usuario_uuid = u.uuid
       INNER JOIN projetos p ON pd.projeto_uuid = p.uuid
       LEFT JOIN docentes doc ON doc.usuario_uuid = u.uuid
       LEFT JOIN departamentos dep ON doc.departamento_uuid = dep.uuid
       WHERE pd.papel = 'ORIENTADOR' AND pd.ativo = true
       AND p.status != 'RASCUNHO' ${where}
       GROUP BY u.uuid, u.nome, u.email, dep.nome
       ORDER BY total_projetos DESC`,
      params,
    );
    return result.rows;
  }

  async getHistoricoOrientador(orientadorUuid: string, filters: ReportFilters) {
    const { conditions, params, paramIndex } = buildWhereClause(filters);
    const where = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT
        p.uuid, p.titulo, p.fase_atual, p.status, p.criado_em, p.curso, p.turma,
        pd.papel, pd.adicionado_em,
        (SELECT COUNT(*) FROM projetos_alunos pa WHERE pa.projeto_uuid = p.uuid) as total_alunos,
        (SELECT COUNT(*) FROM etapas_projeto ep WHERE ep.projeto_uuid = p.uuid AND ep.status = 'CONCLUIDA') as etapas_concluidas,
        (SELECT COUNT(*) FROM etapas_projeto ep WHERE ep.projeto_uuid = p.uuid) as total_etapas
       FROM projetos_docentes pd
       INNER JOIN projetos p ON pd.projeto_uuid = p.uuid
       WHERE pd.usuario_uuid = $${paramIndex}
       AND p.status != 'RASCUNHO' ${where}
       ORDER BY pd.adicionado_em DESC`,
      [...params, orientadorUuid],
    );
    return result.rows;
  }

  // ====== RELATÓRIOS DE NOTÍCIAS ======

  async getNoticiasOverview() {
    const result = await this.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE publicado = true) as publicadas,
        COUNT(*) FILTER (WHERE destaque = true) as destaque,
        COUNT(*) FILTER (WHERE data_expiracao IS NOT NULL AND data_expiracao < NOW()) as expiradas,
        COALESCE(SUM(visualizacoes), 0) as total_visualizacoes,
        COALESCE(SUM(curtidas), 0) as total_curtidas,
        ROUND(AVG(visualizacoes)::numeric, 1) as media_visualizacoes,
        ROUND(AVG(curtidas)::numeric, 1) as media_curtidas
      FROM noticias
    `);
    return result.rows[0];
  }

  async getNoticiasPorCategoria() {
    const result = await this.pool.query(`
      SELECT
        COALESCE(categoria, 'GERAL') as categoria,
        COUNT(*) as total,
        COALESCE(SUM(visualizacoes), 0) as total_visualizacoes,
        COALESCE(SUM(curtidas), 0) as total_curtidas
      FROM noticias
      GROUP BY categoria
      ORDER BY total DESC
    `);
    return result.rows;
  }

  async getNoticiasEngajamento(limit = 20) {
    const result = await this.pool.query(
      `SELECT
        uuid, titulo, categoria, publicado, destaque,
        visualizacoes, curtidas, data_publicacao,
        (visualizacoes + curtidas * 3) as score_engajamento
       FROM noticias
       ORDER BY score_engajamento DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  async getNoticiasTimeline() {
    const result = await this.pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', data_publicacao), 'YYYY-MM') as periodo,
        DATE_TRUNC('month', data_publicacao) as data_inicio,
        COUNT(*) as total,
        COALESCE(SUM(visualizacoes), 0) as total_visualizacoes,
        COALESCE(SUM(curtidas), 0) as total_curtidas
      FROM noticias
      WHERE data_publicacao IS NOT NULL
      GROUP BY periodo, data_inicio
      ORDER BY data_inicio
    `);
    return result.rows;
  }

  // ====== DADOS PARA FILTROS ======

  async getFilterOptions() {
    const [cursos, departamentos, modalidades] = await Promise.all([
      this.pool.query(`SELECT DISTINCT curso as nome FROM projetos WHERE curso IS NOT NULL AND curso != '' ORDER BY curso`),
      this.pool.query(`SELECT uuid, nome, cor_hex as cor FROM departamentos ORDER BY nome`),
      this.pool.query(`SELECT DISTINCT modalidade as nome FROM projetos WHERE modalidade IS NOT NULL AND modalidade != '' ORDER BY modalidade`),
    ]);

    return {
      cursos: cursos.rows,
      departamentos: departamentos.rows,
      modalidades: modalidades.rows,
      fases: ['IDEACAO', 'MODELAGEM', 'PROTOTIPAGEM', 'IMPLEMENTACAO'],
      status: ['RASCUNHO', 'PUBLICADO', 'DESATIVADO'],
    };
  }
}
