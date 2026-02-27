import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class PerfilDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) { }

  /**
   * Obtém cliente de conexão para transações
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Busca dados específicos do aluno
   */
  async buscarAluno(client: PoolClient, usuarioUuid: string): Promise<any> {
    const result = await client.query(
      `SELECT 
        a.*,
        u.nome,
        u.email,
        c.nome as curso_nome,
        c.sigla as curso_sigla,
        t.codigo as turma_codigo
       FROM alunos a
       LEFT JOIN usuarios u ON a.usuario_uuid = u.uuid
       LEFT JOIN cursos c ON a.curso_uuid = c.uuid
       LEFT JOIN turmas t ON a.turma_uuid = t.uuid
       WHERE a.usuario_uuid = $1`,
      [usuarioUuid],
    );
    return result.rows[0] || null;
  }

  /**
   * Busca dados específicos do docente
   */
  async buscarDocente(client: PoolClient, usuarioUuid: string): Promise<any> {
    const result = await client.query(
      `SELECT 
        p.*,
        u.nome,
        u.email,
        d.nome as departamento_nome
       FROM docentes p
       LEFT JOIN usuarios u ON p.usuario_uuid = u.uuid
       LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
       WHERE p.usuario_uuid = $1`,
      [usuarioUuid],
    );
    return result.rows[0] || null;
  }

  /**
   * Atualiza dados do aluno
   */
  async atualizarAluno(
    client: PoolClient,
    usuarioUuid: string,
    dados: any,
  ): Promise<any> {
    const result = await client.query(
      `UPDATE alunos
       SET matricula = COALESCE($1::text, matricula),
           curso_uuid = COALESCE($2::uuid, curso_uuid),
           turma_uuid = COALESCE($3::uuid, turma_uuid),
           telefone = COALESCE($4::text, telefone),
           bio = COALESCE($5::text, bio),
           linkedin_url = COALESCE($6::text, linkedin_url),
           github_url = COALESCE($7::text, github_url),
           portfolio_url = COALESCE($8::text, portfolio_url),
           instagram_url = COALESCE($9::text, instagram_url),
           tiktok_url = COALESCE($10::text, tiktok_url),
           facebook_url = COALESCE($11::text, facebook_url),
           atualizado_em = NOW()
       WHERE usuario_uuid = $12::uuid
       RETURNING *`,
      [
        dados.matricula || null,
        dados.curso_uuid || null,
        dados.turma_uuid || null,
        dados.telefone || null,
        dados.bio || null,
        dados.linkedin_url || null,
        dados.github_url || null,
        dados.portfolio_url || null,
        dados.instagram_url || null,
        dados.tiktok_url || null,
        dados.facebook_url || null,
        usuarioUuid,
      ],
    );
    return result.rows[0];
  }

  /**
   * Atualiza dados do docente
   */
  async atualizarDocente(
    client: PoolClient,
    usuarioUuid: string,
    dados: any,
  ): Promise<any> {
    const result = await client.query(
      `UPDATE docentes
       SET matricula = COALESCE($1::text, matricula),
           departamento_uuid = COALESCE($2::uuid, departamento_uuid),
           especialidade = COALESCE($3::text, especialidade),
           telefone = COALESCE($4::text, telefone),
           bio = COALESCE($5::text, bio),
           linkedin_url = COALESCE($6::text, linkedin_url),
           lattes_url = COALESCE($7::text, lattes_url),
           atualizado_em = NOW()
       WHERE usuario_uuid = $8::uuid
       RETURNING *`,
      [
        dados.matricula || null,
        dados.departamento_uuid || null,
        dados.especialidade || null,
        dados.telefone || null,
        dados.bio || null,
        dados.linkedin_url || null,
        dados.lattes_url || null,
        usuarioUuid,
      ],
    );
    return result.rows[0];
  }

  /**
   * Atualiza primeiro acesso do usuário
   */
  async marcarCadastroCompleto(
    client: PoolClient,
    usuarioUuid: string,
  ): Promise<void> {
    await client.query(
      `UPDATE usuarios
       SET primeiro_acesso = FALSE, atualizado_em = NOW()
       WHERE uuid = $1`,
      [usuarioUuid],
    );
  }

  /**
   * Verifica se matrícula já está em uso
   */
  async verificarMatriculaExistente(
    client: PoolClient,
    matricula: string,
    tipo: 'ALUNO' | 'DOCENTE',
    usuarioUuid: string,
  ): Promise<boolean> {
    const tabela = tipo === 'ALUNO' ? 'alunos' : 'docentes';
    const result = await client.query(
      `SELECT usuario_uuid FROM ${tabela}
       WHERE matricula = $1 AND usuario_uuid != $2`,
      [matricula, usuarioUuid],
    );
    return result.rows.length > 0;
  }

  /**
   * Busca usuários por nome ou email (autocomplete)
   */
  async buscarUsuarios(
    client: PoolClient,
    termo: string,
    tipo?: 'ALUNO' | 'DOCENTE',
  ): Promise<any[]> {
    let query = `
      SELECT u.uuid, u.nome, u.email, u.avatar_url, u.tipo
      FROM usuarios u
      WHERE u.ativo = TRUE 
      AND (
        u.nome ILIKE $1 
        OR u.email ILIKE $1
      )
    `;

    const params = [`%${termo}%`];

    if (tipo) {
      query += ` AND u.tipo = $2`;
      params.push(tipo);
    }

    query += ` ORDER BY u.nome LIMIT 10`;

    const result = await client.query(query, params);
    return result.rows;
  }
}
