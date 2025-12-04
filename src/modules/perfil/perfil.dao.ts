import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class PerfilDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

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
   * Busca dados específicos do professor
   */
  async buscarProfessor(client: PoolClient, usuarioUuid: string): Promise<any> {
    const result = await client.query(
      `SELECT 
        p.*,
        u.nome,
        u.email,
        d.nome as departamento_nome
       FROM professores p
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
       SET matricula = COALESCE($1, matricula),
           curso_uuid = COALESCE($2, curso_uuid),
           turma_uuid = COALESCE($3, turma_uuid),
           telefone = COALESCE($4, telefone),
           bio = COALESCE($5, bio),
           linkedin_url = COALESCE($6, linkedin_url),
           github_url = COALESCE($7, github_url),
           portfolio_url = COALESCE($8, portfolio_url),
           instagram_url = COALESCE($9, instagram_url),
           tiktok_url = COALESCE($10, tiktok_url),
           facebook_url = COALESCE($11, facebook_url),
           cep = COALESCE($12, cep),
           logradouro = COALESCE($13, logradouro),
           numero = COALESCE($14, numero),
           complemento = COALESCE($15, complemento),
           bairro = COALESCE($16, bairro),
           cidade = COALESCE($17, cidade),
           estado = COALESCE($18, estado),
           atualizado_em = NOW()
       WHERE usuario_uuid = $19
       RETURNING *`,
      [
        dados.matricula,
        dados.curso_uuid,
        dados.turma_uuid,
        dados.telefone,
        dados.bio,
        dados.linkedin_url,
        dados.github_url,
        dados.portfolio_url,
        dados.instagram_url,
        dados.tiktok_url,
        dados.facebook_url,
        dados.cep,
        dados.logradouro,
        dados.numero,
        dados.complemento,
        dados.bairro,
        dados.cidade,
        dados.estado,
        usuarioUuid,
      ],
    );
    return result.rows[0];
  }

  /**
   * Atualiza dados do professor
   */
  async atualizarProfessor(
    client: PoolClient,
    usuarioUuid: string,
    dados: any,
  ): Promise<any> {
    const result = await client.query(
      `UPDATE professores
       SET matricula = COALESCE($1, matricula),
           departamento_uuid = COALESCE($2, departamento_uuid),
           especialidade = COALESCE($3, especialidade),
           telefone = COALESCE($4, telefone),
           bio = COALESCE($5, bio),
           linkedin_url = COALESCE($6, linkedin_url),
           lattes_url = COALESCE($7, lattes_url),
           atualizado_em = NOW()
       WHERE usuario_uuid = $8
       RETURNING *`,
      [
        dados.matricula,
        dados.departamento_uuid,
        dados.especialidade,
        dados.telefone,
        dados.bio,
        dados.linkedin_url,
        dados.lattes_url,
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
    tipo: 'ALUNO' | 'PROFESSOR',
    usuarioUuid: string,
  ): Promise<boolean> {
    const tabela = tipo === 'ALUNO' ? 'alunos' : 'professores';
    const result = await client.query(
      `SELECT uuid FROM ${tabela}
       WHERE matricula = $1 AND usuario_uuid != $2`,
      [matricula, usuarioUuid],
    );
    return result.rows.length > 0;
  }
}
