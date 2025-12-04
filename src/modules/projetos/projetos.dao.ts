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
   * @param dados - titulo, descricao, departamento_uuid (opcional)
   * @param usuarioUuid - UUID do usuário (tabela usuarios)
   */
  async criarRascunho(
    dados: any,
    usuarioUuid: string,
    client?: PoolClient,
  ): Promise<string> {
    const db = client || this.pool;

    // Criar projeto
    const result = await db.query(
      `INSERT INTO projetos (
        titulo, descricao, departamento_uuid, 
        criado_por_uuid, lider_uuid, fase_atual, status
      ) VALUES ($1, $2, $3, $4, $4, 'IDEACAO', 'RASCUNHO')
      RETURNING uuid`,
      [dados.titulo, dados.descricao, dados.departamento_uuid || null, usuarioUuid],
    );

    const projetoUuid = result.rows[0].uuid;

    // Criar as 4 etapas obrigatórias automaticamente
    const etapas = [
      { nome: 'Ideação', ordem: 1 },
      { nome: 'Modelagem', ordem: 2 },
      { nome: 'Prototipagem', ordem: 3 },
      { nome: 'Implementação', ordem: 4 },
    ];

    for (const etapa of etapas) {
      await db.query(
        `INSERT INTO etapas_projeto (
          projeto_uuid, nome, status, ordem
        ) VALUES ($1, $2, 'PENDENTE', $3)`,
        [projetoUuid, etapa.nome, etapa.ordem],
      );
    }

    return projetoUuid;
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

    // Campos opcionais
    const bannerUrl = dados.banner_url || null;
    const repositorioUrl = dados.repositorio_url || null;
    const demoUrl = dados.demo_url || null;

    await db.query(
      `UPDATE projetos 
       SET banner_url = COALESCE($1, banner_url), 
           repositorio_url = COALESCE($2, repositorio_url),
           demo_url = COALESCE($3, demo_url),
           fase_atual = 'IDEACAO',
           status = 'PUBLICADO',
           data_publicacao = CURRENT_TIMESTAMP
       WHERE uuid = $4`,
      [bannerUrl, repositorioUrl, demoUrl, projetoUuid],
    );
  }

  /**
   * Busca projeto por UUID
   */
  async buscarPorUuid(uuid: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT p.*, 
              d.nome as departamento_nome, d.cor_hex as departamento_cor,
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
      `SELECT t.uuid, t.nome, t.icone, t.cor_hex as cor
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
   * Lista projetos com filtros e paginação
   */
  async listarProjetos(filtros: any): Promise<{ projetos: any[]; total: number; pagina: number; limite: number; totalPaginas: number }> {
    const params: any[] = [];
    const limit = filtros.limit ? parseInt(filtros.limit) : 10;
    const offset = filtros.offset ? parseInt(filtros.offset) : 0;
    const pagina = Math.floor(offset / limit) + 1;
    
    // Query para contar total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM projetos p
      WHERE p.status = 'PUBLICADO'
    `;
    
    // Query principal com subqueries agregadas para autores, orientadores e tecnologias
    let query = `
      SELECT 
        p.uuid, p.titulo, p.descricao, p.banner_url, p.fase_atual, 
        p.criado_em, p.data_publicacao, p.status, p.visibilidade,
        p.itinerario, p.lab_maker, p.participou_saga,
        d.nome as departamento, d.cor_hex as departamento_cor,
        c.nome as curso_nome, c.sigla as curso_sigla,
        -- Subquery para autores (JSON array)
        (
          SELECT COALESCE(json_agg(json_build_object(
            'nome', u.nome,
            'papel', pa.papel
          ) ORDER BY CASE pa.papel WHEN 'LIDER' THEN 1 ELSE 2 END, u.nome), '[]'::json)
          FROM projetos_alunos pa
          INNER JOIN alunos a ON pa.aluno_uuid = a.uuid
          INNER JOIN usuarios u ON a.usuario_uuid = u.uuid
          WHERE pa.projeto_uuid = p.uuid
        ) as autores,
        -- Subquery para orientadores (JSON array)
        (
          SELECT COALESCE(json_agg(json_build_object(
            'nome', u.nome
          ) ORDER BY u.nome), '[]'::json)
          FROM projetos_professores pp
          INNER JOIN professores prof ON pp.professor_uuid = prof.uuid
          INNER JOIN usuarios u ON prof.usuario_uuid = u.uuid
          WHERE pp.projeto_uuid = p.uuid
        ) as orientadores,
        -- Subquery para tecnologias (JSON array)
        (
          SELECT COALESCE(json_agg(json_build_object(
            'uuid', t.uuid,
            'nome', t.nome,
            'icone', t.icone,
            'cor', t.cor_hex
          ) ORDER BY t.nome), '[]'::json)
          FROM projetos_tecnologias pt
          INNER JOIN tecnologias t ON pt.tecnologia_uuid = t.uuid
          WHERE pt.projeto_uuid = p.uuid
        ) as tecnologias,
        -- Total de autores
        (SELECT COUNT(*) FROM projetos_alunos pa WHERE pa.projeto_uuid = p.uuid) as total_autores
      FROM projetos p
      LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
      LEFT JOIN usuarios lider_user ON p.lider_uuid = lider_user.uuid
      LEFT JOIN alunos lider_aluno ON lider_aluno.usuario_uuid = lider_user.uuid
      LEFT JOIN cursos c ON lider_aluno.curso_uuid = c.uuid
      WHERE p.status = 'PUBLICADO'
    `;

    // Aplicar filtros
    const countParams: any[] = [];
    
    if (filtros.departamento_uuid) {
      params.push(filtros.departamento_uuid);
      countParams.push(filtros.departamento_uuid);
      query += ` AND p.departamento_uuid = $${params.length}`;
      countQuery += ` AND p.departamento_uuid = $${countParams.length}`;
    }

    if (filtros.fase) {
      params.push(filtros.fase);
      countParams.push(filtros.fase);
      query += ` AND p.fase_atual = $${params.length}`;
      countQuery += ` AND p.fase_atual = $${countParams.length}`;
    }

    if (filtros.tecnologia_uuid) {
      params.push(filtros.tecnologia_uuid);
      countParams.push(filtros.tecnologia_uuid);
      query += ` AND EXISTS (
        SELECT 1 FROM projetos_tecnologias pt 
        WHERE pt.projeto_uuid = p.uuid 
        AND pt.tecnologia_uuid = $${params.length}
      )`;
      countQuery += ` AND EXISTS (
        SELECT 1 FROM projetos_tecnologias pt 
        WHERE pt.projeto_uuid = p.uuid 
        AND pt.tecnologia_uuid = $${countParams.length}
      )`;
    }

    if (filtros.busca) {
      params.push(`%${filtros.busca}%`);
      countParams.push(`%${filtros.busca}%`);
      query += ` AND (
        LOWER(p.titulo) LIKE LOWER($${params.length}) OR
        LOWER(p.descricao) LIKE LOWER($${params.length})
      )`;
      countQuery += ` AND (
        LOWER(p.titulo) LIKE LOWER($${countParams.length}) OR
        LOWER(p.descricao) LIKE LOWER($${countParams.length})
      )`;
    }

    query += ' ORDER BY p.data_publicacao DESC NULLS LAST, p.criado_em DESC';

    // Adicionar paginação
    params.push(limit);
    query += ` LIMIT $${params.length}`;
    
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    // Executar queries
    const [countResult, dataResult] = await Promise.all([
      this.pool.query(countQuery, countParams),
      this.pool.query(query, params)
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPaginas = Math.ceil(total / limit);

    return {
      projetos: dataResult.rows,
      total,
      pagina,
      limite: limit,
      totalPaginas
    };
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

    if (dados.itinerario !== undefined) {
      campos.push(`itinerario = $${paramIndex++}`);
      valores.push(dados.itinerario);
    }

    if (dados.lab_maker !== undefined) {
      campos.push(`lab_maker = $${paramIndex++}`);
      valores.push(dados.lab_maker);
    }

    if (dados.participou_saga !== undefined) {
      campos.push(`participou_saga = $${paramIndex++}`);
      valores.push(dados.participou_saga);
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

  /**
   * Lista projetos do usuário logado (publicados e rascunhos)
   */
  async listarMeusProjetos(usuarioUuid: string): Promise<{ publicados: any[]; rascunhos: any[] }> {
    const query = `
      SELECT 
        p.uuid, p.titulo, p.descricao, p.banner_url, p.fase_atual, 
        p.criado_em, p.data_publicacao, p.status, p.visibilidade,
        d.nome as departamento, d.cor_hex as departamento_cor,
        c.nome as curso_nome, c.sigla as curso_sigla,
        -- Subquery para autores (JSON array)
        (
          SELECT COALESCE(json_agg(json_build_object(
            'nome', u.nome,
            'papel', pa.papel
          ) ORDER BY CASE pa.papel WHEN 'LIDER' THEN 1 ELSE 2 END, u.nome), '[]'::json)
          FROM projetos_alunos pa
          INNER JOIN alunos a ON pa.aluno_uuid = a.uuid
          INNER JOIN usuarios u ON a.usuario_uuid = u.uuid
          WHERE pa.projeto_uuid = p.uuid
        ) as autores,
        -- Subquery para orientadores (JSON array)
        (
          SELECT COALESCE(json_agg(json_build_object(
            'nome', u.nome
          ) ORDER BY u.nome), '[]'::json)
          FROM projetos_professores pp
          INNER JOIN professores prof ON pp.professor_uuid = prof.uuid
          INNER JOIN usuarios u ON prof.usuario_uuid = u.uuid
          WHERE pp.projeto_uuid = p.uuid
        ) as orientadores,
        -- Subquery para tecnologias (JSON array)
        (
          SELECT COALESCE(json_agg(json_build_object(
            'uuid', t.uuid,
            'nome', t.nome,
            'icone', t.icone,
            'cor', t.cor_hex
          ) ORDER BY t.nome), '[]'::json)
          FROM projetos_tecnologias pt
          INNER JOIN tecnologias t ON pt.tecnologia_uuid = t.uuid
          WHERE pt.projeto_uuid = p.uuid
        ) as tecnologias,
        -- Total de autores
        (SELECT COUNT(*) FROM projetos_alunos pa WHERE pa.projeto_uuid = p.uuid) as total_autores
      FROM projetos p
      LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
      LEFT JOIN usuarios lider_user ON p.lider_uuid = lider_user.uuid
      LEFT JOIN alunos lider_aluno ON lider_aluno.usuario_uuid = lider_user.uuid
      LEFT JOIN cursos c ON lider_aluno.curso_uuid = c.uuid
      WHERE p.lider_uuid = $1
        AND p.status != 'ARQUIVADO'
      ORDER BY p.criado_em DESC
    `;

    const result = await this.pool.query(query, [usuarioUuid]);
    
    const publicados: any[] = [];
    const rascunhos: any[] = [];
    
    for (const row of result.rows) {
      const projeto = {
        uuid: row.uuid,
        titulo: row.titulo,
        descricao: row.descricao,
        banner_url: row.banner_url,
        fase_atual: row.fase_atual,
        status: row.status,
        visibilidade: row.visibilidade,
        criado_em: row.criado_em,
        data_publicacao: row.data_publicacao,
        departamento: row.departamento ? {
          nome: row.departamento,
          cor_hex: row.departamento_cor,
        } : null,
        curso: row.curso_nome ? {
          nome: row.curso_nome,
          sigla: row.curso_sigla,
        } : null,
        autores: row.autores || [],
        orientadores: row.orientadores || [],
        tecnologias: row.tecnologias || [],
        total_autores: parseInt(row.total_autores || '0'),
      };
      
      if (row.status === 'PUBLICADO') {
        publicados.push(projeto);
      } else if (row.status === 'RASCUNHO') {
        rascunhos.push(projeto);
      }
    }
    
    return { publicados, rascunhos };
  }
}
