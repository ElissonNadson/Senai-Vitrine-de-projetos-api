import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class SolicitacoesDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async criarSolicitacaoDesativacao(
    projetoUuid: string,
    solicitanteUuid: string,
    motivo: string,
    client?: PoolClient,
  ): Promise<string> {
    const db = client || this.pool;
    const result = await db.query(
      `INSERT INTO solicitacoes_desativacao (projeto_uuid, solicitante_uuid, motivo, status)
       VALUES ($1, $2, $3, 'PENDENTE')
       RETURNING uuid`,
      [projetoUuid, solicitanteUuid, motivo],
    );
    return result.rows[0].uuid;
  }

  async buscarSolicitacao(uuid: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT sd.*, u.nome as solicitante_nome, p.titulo as projeto_titulo
       FROM solicitacoes_desativacao sd
       INNER JOIN usuarios u ON sd.solicitante_uuid = u.uuid
       INNER JOIN projetos p ON sd.projeto_uuid = p.uuid
       WHERE sd.uuid = $1`,
      [uuid],
    );
    return result.rows[0] || null;
  }

  async decidirSolicitacao(
    solicitacaoUuid: string,
    status: 'ACEITA' | 'REJEITADA',
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;
    await db.query(
      `UPDATE solicitacoes_desativacao
       SET status = $1, atualizado_em = CURRENT_TIMESTAMP
       WHERE uuid = $2`,
      [status, solicitacaoUuid],
    );
  }
}
