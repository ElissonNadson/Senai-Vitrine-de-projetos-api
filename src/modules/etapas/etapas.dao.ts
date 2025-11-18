import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class EtapasDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  /**
   * Cria nova etapa
   */
  async criarEtapa(
    projetoUuid: string,
    dados: any,
    criadoPorUuid: string,
    client?: PoolClient,
  ): Promise<string> {
    const db = client || this.pool;

    const result = await db.query(
      `INSERT INTO etapas_projeto (
        projeto_uuid, titulo, descricao, tipo_etapa, criado_por_uuid, status
      ) VALUES ($1, $2, $3, $4, $5, 'EM_ANDAMENTO')
      RETURNING uuid`,
      [projetoUuid, dados.titulo, dados.descricao, dados.tipo_etapa, criadoPorUuid],
    );

    return result.rows[0].uuid;
  }

  /**
   * Lista etapas do projeto
   */
  async listarEtapas(projetoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT e.*, 
              u.nome as criado_por_nome,
              (SELECT COUNT(*) FROM anexos_etapas WHERE etapa_uuid = e.uuid) as total_anexos
       FROM etapas_projeto e
       LEFT JOIN usuarios u ON e.criado_por_uuid = u.uuid
       WHERE e.projeto_uuid = $1
       ORDER BY e.criado_em DESC`,
      [projetoUuid],
    );

    return result.rows;
  }

  /**
   * Busca etapa por UUID
   */
  async buscarPorUuid(uuid: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT e.*, 
              u.nome as criado_por_nome,
              uf.nome as feedback_por_nome,
              p.uuid as projeto_uuid
       FROM etapas_projeto e
       LEFT JOIN usuarios u ON e.criado_por_uuid = u.uuid
       LEFT JOIN usuarios uf ON e.feedback_por_uuid = uf.uuid
       LEFT JOIN projetos p ON e.projeto_uuid = p.uuid
       WHERE e.uuid = $1`,
      [uuid],
    );

    return result.rows[0] || null;
  }

  /**
   * Adiciona anexo à etapa
   */
  async adicionarAnexo(
    etapaUuid: string,
    anexo: any,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `INSERT INTO anexos_etapas (etapa_uuid, url, tipo, descricao)
       VALUES ($1, $2, $3, $4)`,
      [etapaUuid, anexo.url, anexo.tipo, anexo.descricao],
    );
  }

  /**
   * Lista anexos da etapa
   */
  async listarAnexos(etapaUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM anexos_etapas 
       WHERE etapa_uuid = $1
       ORDER BY criado_em ASC`,
      [etapaUuid],
    );

    return result.rows;
  }

  /**
   * Atualiza etapa
   */
  async atualizarEtapa(
    etapaUuid: string,
    dados: any,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    const campos: string[] = [];
    const valores: any[] = [];
    let paramIndex = 1;

    if (dados.titulo !== undefined) {
      campos.push(`titulo = $${paramIndex++}`);
      valores.push(dados.titulo);
    }

    if (dados.descricao !== undefined) {
      campos.push(`descricao = $${paramIndex++}`);
      valores.push(dados.descricao);
    }

    if (dados.tipo_etapa !== undefined) {
      campos.push(`tipo_etapa = $${paramIndex++}`);
      valores.push(dados.tipo_etapa);
    }

    if (campos.length === 0) {
      return;
    }

    valores.push(etapaUuid);
    const query = `UPDATE etapas_projeto SET ${campos.join(', ')} WHERE uuid = $${paramIndex}`;

    await db.query(query, valores);
  }

  /**
   * Registra feedback do orientador
   */
  async registrarFeedback(
    etapaUuid: string,
    status: string,
    comentario: string,
    feedbackPorUuid: string,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    const novoStatus =
      status === 'APROVADO'
        ? 'CONCLUIDA'
        : status === 'REVISAR'
          ? 'EM_REVISAO'
          : 'EM_ANDAMENTO';

    await db.query(
      `UPDATE etapas_projeto 
       SET status = $1,
           feedback_orientador = $2,
           feedback_por_uuid = $3,
           feedback_em = CURRENT_TIMESTAMP
       WHERE uuid = $4`,
      [novoStatus, comentario, feedbackPorUuid, etapaUuid],
    );
  }

  /**
   * Marca etapa como concluída
   */
  async concluirEtapa(
    etapaUuid: string,
    observacoes: string | undefined,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `UPDATE etapas_projeto 
       SET status = 'PENDENTE_ORIENTADOR',
           concluido_em = CURRENT_TIMESTAMP,
           observacoes_conclusao = $1
       WHERE uuid = $2`,
      [observacoes, etapaUuid],
    );
  }

  /**
   * Deleta etapa
   */
  async deletarEtapa(etapaUuid: string, client?: PoolClient): Promise<void> {
    const db = client || this.pool;

    // Deleta anexos primeiro (CASCADE deve fazer isso automaticamente, mas por segurança)
    await db.query('DELETE FROM anexos_etapas WHERE etapa_uuid = $1', [
      etapaUuid,
    ]);

    // Deleta etapa
    await db.query('DELETE FROM etapas_projeto WHERE uuid = $1', [etapaUuid]);
  }

  /**
   * Conta etapas pendentes de feedback
   */
  async contarEtapasPendentes(projetoUuid: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) as total 
       FROM etapas_projeto 
       WHERE projeto_uuid = $1 AND status = 'PENDENTE_ORIENTADOR'`,
      [projetoUuid],
    );

    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Deleta anexo
   */
  async deletarAnexo(anexoUuid: string): Promise<string | null> {
    const result = await this.pool.query(
      'DELETE FROM anexos_etapas WHERE uuid = $1 RETURNING url',
      [anexoUuid],
    );

    return result.rows[0]?.url || null;
  }
}
