import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class ProjetosDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  /**
   * Verifica se título já existe
   */
  async verificarTituloExistente(
    titulo: string,
    excluirUuid?: string,
  ): Promise<boolean> {
    const params: any[] = [titulo];
    let query = 'SELECT uuid FROM projetos WHERE LOWER(titulo) = LOWER($1)';

    if (excluirUuid) {
      params.push(excluirUuid);
      query += ' AND uuid != $2';
    }

    const result = await this.pool.query(query, params);
    return result.rows.length > 0;
  }

  /**
   * Cria rascunho inicial do projeto (Passo 1)
   */
  async criarRascunho(
    dados: any,
    alunoUuid: string,
    client?: PoolClient,
  ): Promise<string> {
    const db = client || this.pool;
    console.log(alunoUuid);

    const result = await db.query(
      `INSERT INTO projetos (
        titulo, descricao, departamento_uuid, 
        criado_por_uuid, lider_uuid, fase_atual
      ) VALUES ($1, $2, $3, $4, $5, 'IDEACAO')
      RETURNING uuid`,
      [dados.titulo, dados.descricao, dados.departamento_uuid, alunoUuid, alunoUuid],
    );

    return result.rows[0].uuid;
  }

  /**
   * Adiciona autores ao projeto (Passo 2)
   */
  async adicionarAutores(
    projetoUuid: string,
    autores: any[],
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    for (const autor of autores) {
      await db.query(
        `INSERT INTO projetos_alunos (projeto_uuid, aluno_uuid, papel)
         VALUES ($1, $2, $3)`,
        [projetoUuid, autor.aluno_uuid, autor.papel],
      );
    }
  }

  /**
   * Adiciona orientadores ao projeto (Passo 3)
   */
  async adicionarOrientadores(
    projetoUuid: string,
    orientadoresUuids: string[],
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    for (const professorUuid of orientadoresUuids) {
      await db.query(
        `INSERT INTO projetos_professores (projeto_uuid, professor_uuid)
         VALUES ($1, $2)`,
        [projetoUuid, professorUuid],
      );
    }
  }

  /**
   * Adiciona tecnologias ao projeto (Passo 3)
   */
  async adicionarTecnologias(
    projetoUuid: string,
    tecnologiasUuids: string[],
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    for (const tecnologiaUuid of tecnologiasUuids) {
      await db.query(
        `INSERT INTO projetos_tecnologias (projeto_uuid, tecnologia_uuid)
         VALUES ($1, $2)`,
        [projetoUuid, tecnologiaUuid],
      );
    }
  }

  /**
   * Atualiza projeto com informações adicionais (Passo 3)
   */
  async atualizarPasso3(
    projetoUuid: string,
    dados: any,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `UPDATE projetos 
       SET objetivos = $1, resultados_esperados = $2
       WHERE uuid = $3`,
      [dados.objetivos, dados.resultados_esperados, projetoUuid],
    );
  }

  /**
   * Finaliza projeto e publica (Passo 4)
   */
  async publicarProjeto(
    projetoUuid: string,
    dados: any,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `UPDATE projetos 
       SET banner_url = $1, 
           repositorio_url = $2, 
           demo_url = $3,
           fase_atual = 'PLANEJAMENTO',
           publicado_em = CURRENT_TIMESTAMP
       WHERE uuid = $4`,
      [dados.banner_url, dados.repositorio_url, dados.demo_url, projetoUuid],
    );
  }

  /**
   * Busca projeto por UUID
   */
  async buscarPorUuid(uuid: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT p.*, 
              d.nome as departamento_nome, d.cor as departamento_cor,
              u.nome as criado_por_nome, u.email as criado_por_email
       FROM projetos p
       LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
       LEFT JOIN usuarios u ON p.criado_por_uuid = u.uuid
       WHERE p.uuid = $1`,
      [uuid],
    );

    return result.rows[0] || null;
  }

  /**
   * Busca autores do projeto
   */
  async buscarAutores(projetoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT pa.papel, a.uuid as aluno_uuid, u.nome, u.email, u.avatar_url,
              a.matricula, c.sigla as curso_sigla
       FROM projetos_alunos pa
       INNER JOIN alunos a ON pa.aluno_uuid = a.uuid
       INNER JOIN usuarios u ON a.usuario_uuid = u.uuid
       LEFT JOIN cursos c ON a.curso_uuid = c.uuid
       WHERE pa.projeto_uuid = $1
       ORDER BY 
         CASE pa.papel 
           WHEN 'LIDER' THEN 1 
           WHEN 'AUTOR' THEN 2 
         END,
         u.nome`,
      [projetoUuid],
    );

    return result.rows;
  }

  /**
   * Busca orientadores do projeto
   */
  async buscarOrientadores(projetoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT p.uuid as professor_uuid, u.nome, u.email, u.avatar_url,
              d.nome as departamento_nome
       FROM projetos_professores pp
       INNER JOIN professores p ON pp.professor_uuid = p.uuid
       INNER JOIN usuarios u ON p.usuario_uuid = u.uuid
       LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
       WHERE pp.projeto_uuid = $1
       ORDER BY u.nome`,
      [projetoUuid],
    );

    return result.rows;
  }

  /**
   * Busca tecnologias do projeto
   */
  async buscarTecnologias(projetoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT t.uuid, t.nome, t.icone_url, t.cor
       FROM projetos_tecnologias pt
       INNER JOIN tecnologias t ON pt.tecnologia_uuid = t.uuid
       WHERE pt.projeto_uuid = $1
       ORDER BY t.nome`,
      [projetoUuid],
    );

    return result.rows;
  }

  /**
   * Verifica se usuário é autor/líder do projeto
   */
  async verificarAutorProjeto(
    projetoUuid: string,
    alunoUuid: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM projetos_alunos WHERE projeto_uuid = $1 AND aluno_uuid = $2',
      [projetoUuid, alunoUuid],
    );

    return result.rows.length > 0;
  }

  /**
   * Verifica se usuário é orientador do projeto
   */
  async verificarOrientadorProjeto(
    projetoUuid: string,
    professorUuid: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM projetos_professores WHERE projeto_uuid = $1 AND professor_uuid = $2',
      [projetoUuid, professorUuid],
    );

    return result.rows.length > 0;
  }

  /**
   * Lista projetos com filtros
   */
  async listarProjetos(filtros: any): Promise<any[]> {
    const params: any[] = [];
    let query = `
      SELECT p.uuid, p.titulo, p.descricao, p.banner_url, p.fase_atual, 
             p.criado_em, p.publicado_em,
             d.nome as departamento, d.cor as departamento_cor,
             (SELECT COUNT(*) FROM projetos_alunos pa WHERE pa.projeto_uuid = p.uuid) as total_autores
      FROM projetos p
      LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
      WHERE p.fase_atual != 'RASCUNHO'
    `;

    if (filtros.departamento_uuid) {
      params.push(filtros.departamento_uuid);
      query += ` AND p.departamento_uuid = $${params.length}`;
    }

    if (filtros.fase) {
      params.push(filtros.fase);
      query += ` AND p.fase_atual = $${params.length}`;
    }

    if (filtros.tecnologia_uuid) {
      params.push(filtros.tecnologia_uuid);
      query += ` AND EXISTS (
        SELECT 1 FROM projetos_tecnologias pt 
        WHERE pt.projeto_uuid = p.uuid 
        AND pt.tecnologia_uuid = $${params.length}
      )`;
    }

    if (filtros.busca) {
      params.push(`%${filtros.busca}%`);
      query += ` AND (
        LOWER(p.titulo) LIKE LOWER($${params.length}) OR
        LOWER(p.descricao) LIKE LOWER($${params.length})
      )`;
    }

    query += ' ORDER BY p.publicado_em DESC';

    if (filtros.limit) {
      params.push(filtros.limit);
      query += ` LIMIT $${params.length}`;
    }

    if (filtros.offset) {
      params.push(filtros.offset);
      query += ` OFFSET $${params.length}`;
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Atualiza informações do projeto
   */
  async atualizarProjeto(
    projetoUuid: string,
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

    if (dados.objetivos !== undefined) {
      campos.push(`objetivos = $${paramIndex++}`);
      valores.push(dados.objetivos);
    }

    if (dados.resultados_esperados !== undefined) {
      campos.push(`resultados_esperados = $${paramIndex++}`);
      valores.push(dados.resultados_esperados);
    }

    if (dados.departamento_uuid !== undefined) {
      campos.push(`departamento_uuid = $${paramIndex++}`);
      valores.push(dados.departamento_uuid);
    }

    if (dados.repositorio_url !== undefined) {
      campos.push(`repositorio_url = $${paramIndex++}`);
      valores.push(dados.repositorio_url);
    }

    if (dados.demo_url !== undefined) {
      campos.push(`demo_url = $${paramIndex++}`);
      valores.push(dados.demo_url);
    }

    if (campos.length === 0) {
      return;
    }

    valores.push(projetoUuid);
    const query = `UPDATE projetos SET ${campos.join(', ')} WHERE uuid = $${paramIndex}`;

    await db.query(query, valores);
  }

  /**
   * Remove todas as tecnologias do projeto
   */
  async removerTecnologias(
    projetoUuid: string,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;
    await db.query(
      'DELETE FROM projetos_tecnologias WHERE projeto_uuid = $1',
      [projetoUuid],
    );
  }

  /**
   * Deleta projeto (soft delete)
   */
  async deletarProjeto(projetoUuid: string): Promise<void> {
    await this.pool.query(
      'UPDATE projetos SET fase_atual = $1 WHERE uuid = $2',
      ['ARQUIVADO', projetoUuid],
    );
  }
}
