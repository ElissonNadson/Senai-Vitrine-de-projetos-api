import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { CriarSessaoDTO, SessaoDTO } from './dto/sessao.dto';

@Injectable()
export class SessoesDAO {
  private readonly logger = new Logger(SessoesDAO.name);

  constructor(@Inject('PG_POOL') private pool: Pool) { }

  /**
   * Cria uma nova sessão para o usuário
   */
  async criarSessao(dados: CriarSessaoDTO): Promise<SessaoDTO> {
    const query = `
      INSERT INTO sessoes_usuarios (
        usuario_uuid, token_hash, ip_address, user_agent,
        navegador, sistema_operacional, dispositivo, localizacao, expira_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      dados.usuario_uuid,
      dados.token_hash,
      dados.ip_address || null,
      dados.user_agent || null,
      dados.navegador || null,
      dados.sistema_operacional || null,
      dados.dispositivo || null,
      dados.localizacao || null,
      dados.expira_em,
    ]);

    return result.rows[0];
  }

  /**
   * Busca todas as sessões ativas de um usuário
   */
  async buscarSessoesAtivas(usuarioUuid: string): Promise<SessaoDTO[]> {
    const query = `
      SELECT uuid, usuario_uuid, ip_address, user_agent, navegador,
             sistema_operacional, dispositivo, localizacao,
             criado_em, ultimo_acesso, expira_em, ativo
      FROM sessoes_usuarios
      WHERE usuario_uuid = $1 
        AND ativo = true 
        AND expira_em > NOW()
      ORDER BY ultimo_acesso DESC
    `;

    const result = await this.pool.query(query, [usuarioUuid]);
    return result.rows;
  }

  /**
   * Busca uma sessão pelo hash do token
   */
  async buscarPorTokenHash(tokenHash: string): Promise<SessaoDTO | null> {
    const query = `
      SELECT uuid, usuario_uuid, ip_address, user_agent, navegador,
             sistema_operacional, dispositivo, localizacao,
             criado_em, ultimo_acesso, expira_em, ativo
      FROM sessoes_usuarios
      WHERE token_hash = $1 AND ativo = true
    `;

    const result = await this.pool.query(query, [tokenHash]);
    return result.rows[0] || null;
  }

  /**
   * Busca uma sessão pelo UUID
   */
  async buscarPorUuid(uuid: string): Promise<SessaoDTO | null> {
    const query = `
      SELECT uuid, usuario_uuid, ip_address, user_agent, navegador,
             sistema_operacional, dispositivo, localizacao,
             criado_em, ultimo_acesso, expira_em, ativo
      FROM sessoes_usuarios
      WHERE uuid = $1
    `;

    const result = await this.pool.query(query, [uuid]);
    return result.rows[0] || null;
  }

  /**
   * Atualiza o último acesso de uma sessão
   */
  async atualizarUltimoAcesso(tokenHash: string): Promise<void> {
    const query = `
      UPDATE sessoes_usuarios
      SET ultimo_acesso = NOW()
      WHERE token_hash = $1 AND ativo = true
    `;

    await this.pool.query(query, [tokenHash]);
  }

  /**
   * Desativa uma sessão específica
   */
  async desativarSessao(uuid: string): Promise<boolean> {
    const query = `
      UPDATE sessoes_usuarios
      SET ativo = false
      WHERE uuid = $1
      RETURNING uuid
    `;

    const result = await this.pool.query(query, [uuid]);
    return result.rowCount > 0;
  }

  /**
   * Desativa uma sessão pelo hash do token
   */
  async desativarSessaoPorToken(tokenHash: string): Promise<boolean> {
    const query = `
      UPDATE sessoes_usuarios
      SET ativo = false
      WHERE token_hash = $1
      RETURNING uuid
    `;

    const result = await this.pool.query(query, [tokenHash]);
    return result.rowCount > 0;
  }

  /**
   * Desativa todas as sessões de um usuário exceto a atual
   */
  async desativarOutrasSessoes(usuarioUuid: string, tokenHashAtual: string): Promise<number> {
    const query = `
      UPDATE sessoes_usuarios
      SET ativo = false
      WHERE usuario_uuid = $1 
        AND token_hash != $2 
        AND ativo = true
      RETURNING uuid
    `;

    const result = await this.pool.query(query, [usuarioUuid, tokenHashAtual]);
    return result.rowCount;
  }

  /**
   * Desativa todas as sessões de um usuário
   */
  async desativarTodasSessoes(usuarioUuid: string): Promise<number> {
    const query = `
      UPDATE sessoes_usuarios
      SET ativo = false
      WHERE usuario_uuid = $1 AND ativo = true
      RETURNING uuid
    `;

    const result = await this.pool.query(query, [usuarioUuid]);
    return result.rowCount;
  }

  /**
   * Remove sessões expiradas ou inativas há muito tempo
   */
  async limparSessoesExpiradas(): Promise<number> {
    const query = `
      DELETE FROM sessoes_usuarios
      WHERE expira_em < NOW() 
        OR (ativo = false AND ultimo_acesso < NOW() - INTERVAL '7 days')
      RETURNING uuid
    `;

    const result = await this.pool.query(query);
    return result.rowCount;
  }

  /**
   * Busca uma sessão ativa existente com os mesmos parâmetros
   */
  async buscarSessaoExistente(
    usuarioUuid: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<SessaoDTO | null> {
    const query = `
      SELECT uuid, usuario_uuid, ip_address, user_agent, navegador,
             sistema_operacional, dispositivo, localizacao,
             criado_em, ultimo_acesso, expira_em, ativo
      FROM sessoes_usuarios
      WHERE usuario_uuid = $1
        AND ip_address = $2
        AND user_agent = $3
        AND ativo = true
        AND expira_em > NOW()
    `;

    const result = await this.pool.query(query, [usuarioUuid, ipAddress, userAgent]);
    return result.rows[0] || null;
  }

  /**
   * Atualiza o token e a data de expiração de uma sessão existente
   */
  async atualizarTokenSessao(
    sessaoUuid: string,
    tokenHash: string,
    expiraEm: Date,
  ): Promise<void> {
    const query = `
      UPDATE sessoes_usuarios
      SET token_hash = $1,
          expira_em = $2,
          ultimo_acesso = NOW(),
          ativo = true
      WHERE uuid = $3
    `;

    await this.pool.query(query, [tokenHash, expiraEm, sessaoUuid]);
  }

  /**
   * Verifica se o dispositivo/navegador já foi usado pelo usuário
   */
  async verificarDispositivoConhecido(
    usuarioUuid: string,
    navegador: string,
    sistemaOperacional: string,
  ): Promise<boolean> {
    const query = `
      SELECT 1 FROM sessoes_usuarios
      WHERE usuario_uuid = $1
        AND navegador = $2
        AND sistema_operacional = $3
      LIMIT 1
    `;

    const result = await this.pool.query(query, [
      usuarioUuid,
      navegador,
      sistemaOperacional,
    ]);

    return result.rowCount > 0;
  }
}
