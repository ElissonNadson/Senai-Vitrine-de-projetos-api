import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class ProjetosArquivadosDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) { }

  /**
   * Verifica se o aluno pertence ao projeto
   */
  async verificarAlunoNoProjeto(
    projetoUuid: string,
    alunoUuid: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM projetos_alunos 
       WHERE projeto_uuid = $1 AND usuario_uuid = $2`,
      [projetoUuid, alunoUuid],
    );
    return result.rows.length > 0;
  }

  /**
   * Busca orientador do projeto
   */
  async buscarOrientadorDoProjeto(projetoUuid: string): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT usuario_uuid FROM projetos_docentes 
       WHERE projeto_uuid = $1 
       LIMIT 1`,
      [projetoUuid],
    );
    return result.rows.length > 0 ? result.rows[0].usuario_uuid : null;
  }

  /**
   * Verifica se já existe solicitação pendente para o projeto
   */
  async verificarSolicitacaoPendente(projetoUuid: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM projetos_arquivados 
       WHERE projeto_uuid = $1 AND status = 'PENDENTE'`,
      [projetoUuid],
    );
    return result.rows.length > 0;
  }

  /**
   * Cria solicitação de arquivamento
   */
  async criarSolicitacao(
    projetoUuid: string,
    alunoUuid: string,
    orientadorUuid: string,
    justificativa: string,
    client?: PoolClient,
  ): Promise<any> {
    const db = client || this.pool;

    const result = await db.query(
      `INSERT INTO projetos_arquivados 
       (projeto_uuid, aluno_uuid, orientador_uuid, justificativa, status) 
       VALUES ($1, $2, $3, $4, 'PENDENTE') 
       RETURNING *`,
      [projetoUuid, alunoUuid, orientadorUuid, justificativa],
    );

    return result.rows[0];
  }

  /**
   * Busca solicitação por UUID
   */
  async buscarSolicitacaoPorUuid(solicitacaoUuid: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT 
        pa.*,
        p.titulo as projeto_titulo,
        aluno.nome as aluno_nome,
        aluno.email as aluno_email,
        orientador.nome as orientador_nome,
        orientador.email as orientador_email
       FROM projetos_arquivados pa
       INNER JOIN projetos p ON pa.projeto_uuid = p.uuid
       INNER JOIN usuarios aluno ON pa.aluno_uuid = aluno.uuid
       INNER JOIN usuarios orientador ON pa.orientador_uuid = orientador.uuid
       WHERE pa.uuid = $1`,
      [solicitacaoUuid],
    );

    return result.rows[0] || null;
  }

  /**
   * Lista solicitações pendentes do orientador
   */
  async listarSolicitacoesPendentes(orientadorUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
        pa.*,
        p.titulo as projeto_titulo,
        aluno.nome as aluno_nome,
        aluno.email as aluno_email
       FROM projetos_arquivados pa
       INNER JOIN projetos p ON pa.projeto_uuid = p.uuid
       INNER JOIN usuarios aluno ON pa.aluno_uuid = aluno.uuid
       WHERE pa.orientador_uuid = $1 AND pa.status = 'PENDENTE'
       ORDER BY pa.created_at DESC`,
      [orientadorUuid],
    );

    return result.rows;
  }

  /**
   * Lista solicitações do aluno
   */
  async listarSolicitacoesDoAluno(alunoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
        pa.*,
        p.titulo as projeto_titulo,
        orientador.nome as orientador_nome
       FROM projetos_arquivados pa
       INNER JOIN projetos p ON pa.projeto_uuid = p.uuid
       INNER JOIN usuarios orientador ON pa.orientador_uuid = orientador.uuid
       WHERE pa.aluno_uuid = $1
       ORDER BY pa.created_at DESC`,
      [alunoUuid],
    );

    return result.rows;
  }

  /**
   * Aprova solicitação e atualiza status do projeto
   */
  async aprovarSolicitacao(
    solicitacaoUuid: string,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    // Atualiza status da solicitação
    await db.query(
      `UPDATE projetos_arquivados 
       SET status = 'APROVADO', respondido_em = CURRENT_TIMESTAMP 
       WHERE uuid = $1`,
      [solicitacaoUuid],
    );

    // Busca projeto relacionado
    const solicitacao = await db.query(
      `SELECT projeto_uuid FROM projetos_arquivados WHERE uuid = $1`,
      [solicitacaoUuid],
    );

    if (solicitacao.rows.length > 0) {
      // Atualiza status do projeto para ARQUIVADO
      await db.query(
        `UPDATE projetos 
         SET status = 'ARQUIVADO', arquivado = TRUE
         WHERE uuid = $1`,
        [solicitacao.rows[0].projeto_uuid],
      );
    }
  }

  /**
   * Nega solicitação
   */
  async negarSolicitacao(
    solicitacaoUuid: string,
    justificativaNegacao: string,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `UPDATE projetos_arquivados 
       SET status = 'NEGADO', 
           justificativa_negacao = $2, 
           respondido_em = CURRENT_TIMESTAMP 
       WHERE uuid = $1`,
      [solicitacaoUuid, justificativaNegacao],
    );
  }

  /**
   * Verifica se orientador tem permissão sobre a solicitação
   */
  async verificarPermissaoOrientador(
    solicitacaoUuid: string,
    orientadorUuid: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM projetos_arquivados 
       WHERE uuid = $1 AND orientador_uuid = $2`,
      [solicitacaoUuid, orientadorUuid],
    );
    return result.rows.length > 0;
  }

  /**
   * Busca histórico de solicitações de um projeto
   */
  async buscarHistoricoProjeto(projetoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
        pa.*,
        aluno.nome as aluno_nome,
        orientador.nome as orientador_nome
       FROM projetos_arquivados pa
       INNER JOIN usuarios aluno ON pa.aluno_uuid = aluno.uuid
       INNER JOIN usuarios orientador ON pa.orientador_uuid = orientador.uuid
       WHERE pa.projeto_uuid = $1
       ORDER BY pa.created_at DESC`,
      [projetoUuid],
    );

    return result.rows;
  }
}
