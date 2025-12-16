import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class NotificacoesDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  /**
   * Cria nova notificação
   */
  async criarNotificacao(
    usuarioUuid: string,
    tipo: string,
    titulo: string,
    mensagem: string,
    linkRelacionado?: string,
    client?: PoolClient,
  ): Promise<string> {
    const db = client || this.pool;

    const result = await db.query(
      `INSERT INTO notificacoes (
        usuario_uuid, tipo, titulo, mensagem, link
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING uuid`,
      [usuarioUuid, tipo, titulo, mensagem, linkRelacionado],
    );

    return result.rows[0].uuid;
  }

  /**
   * Lista notificações do usuário
   */
  async listarNotificacoes(
    usuarioUuid: string,
    apenasNaoLidas: boolean = false,
  ): Promise<any[]> {
    let query = `
      SELECT * FROM notificacoes 
      WHERE usuario_uuid = $1
    `;

    if (apenasNaoLidas) {
      query += ' AND lida = FALSE';
    }

    query += ' ORDER BY criado_em DESC LIMIT 50';

    const result = await this.pool.query(query, [usuarioUuid]);
    return result.rows;
  }

  /**
   * Conta notificações não lidas
   */
  async contarNaoLidas(usuarioUuid: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as total FROM notificacoes WHERE usuario_uuid = $1 AND lida = FALSE',
      [usuarioUuid],
    );

    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Marca notificação como lida
   */
  async marcarComoLida(
    notificacaoUuid: string,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      'UPDATE notificacoes SET lida = TRUE, lida_em = CURRENT_TIMESTAMP WHERE uuid = $1',
      [notificacaoUuid],
    );
  }

  /**
   * Marca todas como lidas
   */
  async marcarTodasComoLidas(
    usuarioUuid: string,
    client?: PoolClient,
  ): Promise<number> {
    const db = client || this.pool;

    const result = await db.query(
      'UPDATE notificacoes SET lida = TRUE, lida_em = CURRENT_TIMESTAMP WHERE usuario_uuid = $1 AND lida = FALSE',
      [usuarioUuid],
    );

    return result.rowCount || 0;
  }

  /**
   * Deleta notificação
   */
  async deletarNotificacao(notificacaoUuid: string): Promise<void> {
    await this.pool.query('DELETE FROM notificacoes WHERE uuid = $1', [
      notificacaoUuid,
    ]);
  }

  /**
   * Busca notificação por UUID
   */
  async buscarPorUuid(notificacaoUuid: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM notificacoes WHERE uuid = $1',
      [notificacaoUuid],
    );

    return result.rows[0] || null;
  }
}
