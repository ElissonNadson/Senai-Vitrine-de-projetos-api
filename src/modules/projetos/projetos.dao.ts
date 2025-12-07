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
   * @param dados - titulo, descricao, categoria, departamento_uuid (opcional)
   * @param usuarioUuid - UUID do usuário (tabela usuarios)
   */
  async criarRascunho(
    dados: any,
    usuarioUuid: string,
    client?: PoolClient,
  ): Promise<string> {
    const db = client || this.pool;

    // Criar projeto com novos campos
    const result = await db.query(
      `INSERT INTO projetos (
        titulo, descricao, categoria, departamento_uuid, 
        criado_por_uuid, lider_uuid, fase_atual, status
      ) VALUES ($1, $2, $3, $4, $5, $5, 'IDEACAO', 'RASCUNHO')
      RETURNING uuid`,
      [
        dados.titulo, 
        dados.descricao, 
        dados.categoria,
        dados.departamento_uuid || null, 
        usuarioUuid
      ],
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
   * Para ALUNO: busca projetos onde é líder
   * Para PROFESSOR: busca projetos onde é orientador
   */
  async listarMeusProjetos(usuarioUuid: string, tipoUsuario: string = 'ALUNO'): Promise<{ publicados: any[]; rascunhos: any[] }> {
    let whereClause: string;
    let params: any[];

    if (tipoUsuario.toUpperCase() === 'PROFESSOR') {
      // Para professor, primeiro buscar o professor_uuid
      const professorResult = await this.pool.query(
        'SELECT uuid FROM professores WHERE usuario_uuid = $1',
        [usuarioUuid]
      );

      if (professorResult.rows.length === 0) {
        return { publicados: [], rascunhos: [] };
      }

      const professorUuid = professorResult.rows[0].uuid;
      whereClause = `WHERE p.uuid IN (
        SELECT pp.projeto_uuid FROM projetos_professores pp WHERE pp.professor_uuid = $1
      ) AND p.status != 'ARQUIVADO'`;
      params = [professorUuid];
    } else {
      // Para aluno, buscar por lider_uuid
      whereClause = `WHERE p.lider_uuid = $1 AND p.status != 'ARQUIVADO'`;
      params = [usuarioUuid];
    }

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
      ${whereClause}
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

  /**
   * Atualiza informações acadêmicas do projeto (Passo 2)
   */
  async atualizarInformacoesAcademicas(
    projetoUuid: string,
    dados: any,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `UPDATE projetos 
       SET curso = $1, 
           turma = $2, 
           modalidade = $3,
           unidade_curricular = $4,
           itinerario = $5,
           senai_lab = $6,
           saga_senai = $7,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE uuid = $8`,
      [
        dados.curso,
        dados.turma,
        dados.modalidade,
        dados.unidade_curricular || null,
        dados.itinerario || false,
        dados.senai_lab || false,
        dados.saga_senai || false,
        projetoUuid,
      ],
    );
  }

  /**
   * Salva ou atualiza fase do projeto (Passo 4)
   */
  async salvarFaseProjeto(
    projetoUuid: string,
    nomeFase: string,
    descricao: string,
    ordem: number,
    client?: PoolClient,
  ): Promise<string> {
    const db = client || this.pool;

    const result = await db.query(
      `INSERT INTO projetos_fases (projeto_uuid, nome_fase, descricao, ordem)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (projeto_uuid, nome_fase) 
       DO UPDATE SET descricao = $3, atualizado_em = CURRENT_TIMESTAMP
       RETURNING uuid`,
      [projetoUuid, nomeFase, descricao, ordem],
    );

    return result.rows[0].uuid;
  }

  /**
   * Salva anexo de uma fase
   */
  async salvarAnexoFase(
    faseUuid: string,
    anexo: any,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `INSERT INTO projetos_fases_anexos 
       (fase_uuid, tipo_anexo, nome_arquivo, url_arquivo, tamanho_bytes, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (fase_uuid, tipo_anexo, nome_arquivo) 
       DO UPDATE SET url_arquivo = $4, tamanho_bytes = $5, mime_type = $6`,
      [
        faseUuid,
        anexo.tipo,
        anexo.nome_arquivo,
        anexo.url_arquivo,
        anexo.tamanho_bytes || null,
        anexo.mime_type || null,
      ],
    );
  }

  /**
   * Remove todos os anexos de uma fase
   */
  async removerAnexosFase(
    faseUuid: string,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;
    await db.query('DELETE FROM projetos_fases_anexos WHERE fase_uuid = $1', [faseUuid]);
  }

  /**
   * Atualiza configurações de repositório e privacidade (Passo 5)
   */
  async atualizarRepositorioPrivacidade(
    projetoUuid: string,
    dados: any,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `UPDATE projetos 
       SET has_repositorio = $1,
           tipo_repositorio = $2,
           link_repositorio = $3,
           codigo_visibilidade = $4,
           anexos_visibilidade = $5,
           aceitou_termos = $6,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE uuid = $7`,
      [
        dados.has_repositorio,
        dados.tipo_repositorio || null,
        dados.link_repositorio || null,
        dados.codigo_visibilidade || 'Público',
        dados.anexos_visibilidade || 'Público',
        dados.aceitou_termos,
        projetoUuid,
      ],
    );
  }

  /**
   * Salva arquivo de código fonte (ZIP)
   */
  async salvarCodigoFonte(
    projetoUuid: string,
    nomeArquivo: string,
    urlArquivo: string,
    tamanhoBytes: number,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `INSERT INTO projetos_codigo 
       (projeto_uuid, nome_arquivo, url_arquivo, tamanho_bytes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (projeto_uuid) 
       DO UPDATE SET nome_arquivo = $2, url_arquivo = $3, tamanho_bytes = $4, atualizado_em = CURRENT_TIMESTAMP`,
      [projetoUuid, nomeArquivo, urlArquivo, tamanhoBytes],
    );
  }

  /**
   * Busca fases do projeto com anexos
   */
  async buscarFasesProjeto(projetoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
        pf.uuid,
        pf.nome_fase,
        pf.descricao,
        pf.ordem,
        json_agg(
          json_build_object(
            'uuid', pfa.uuid,
            'tipo_anexo', pfa.tipo_anexo,
            'nome_arquivo', pfa.nome_arquivo,
            'url_arquivo', pfa.url_arquivo,
            'tamanho_bytes', pfa.tamanho_bytes,
            'mime_type', pfa.mime_type,
            'criado_em', pfa.criado_em
          ) ORDER BY pfa.criado_em
        ) FILTER (WHERE pfa.uuid IS NOT NULL) as anexos
       FROM projetos_fases pf
       LEFT JOIN projetos_fases_anexos pfa ON pf.uuid = pfa.fase_uuid
       WHERE pf.projeto_uuid = $1
       GROUP BY pf.uuid, pf.nome_fase, pf.descricao, pf.ordem
       ORDER BY pf.ordem`,
      [projetoUuid],
    );

    return result.rows;
  }

  /**
   * Busca código fonte do projeto
   */
  async buscarCodigoFonte(projetoUuid: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT uuid, nome_arquivo, url_arquivo, tamanho_bytes, criado_em
       FROM projetos_codigo
       WHERE projeto_uuid = $1`,
      [projetoUuid],
    );

    return result.rows[0] || null;
  }

  /**
   * Registra log de auditoria
   */
  async registrarAuditoria(
    projetoUuid: string,
    usuarioUuid: string,
    acao: string,
    descricao: string,
    dadosAnteriores: any,
    dadosNovos: any,
    ipAddress?: string,
    userAgent?: string,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `INSERT INTO projetos_auditoria 
       (projeto_uuid, usuario_uuid, acao, descricao, dados_anteriores, dados_novos, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        projetoUuid,
        usuarioUuid,
        acao,
        descricao,
        dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
        dadosNovos ? JSON.stringify(dadosNovos) : null,
        ipAddress || null,
        userAgent || null,
      ],
    );
  }

  /**
   * Busca histórico de auditoria de um projeto
   */
  async buscarAuditoriaProjeto(
    projetoUuid: string,
    limite?: number,
  ): Promise<any[]> {
    const query = `
      SELECT 
        pa.uuid,
        pa.acao,
        pa.descricao,
        pa.dados_anteriores,
        pa.dados_novos,
        pa.ip_address,
        pa.criado_em,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.tipo as usuario_tipo
      FROM projetos_auditoria pa
      INNER JOIN usuarios u ON pa.usuario_uuid = u.uuid
      WHERE pa.projeto_uuid = $1
      ORDER BY pa.criado_em DESC
      ${limite ? `LIMIT ${limite}` : ''}
    `;

    const result = await this.pool.query(query, [projetoUuid]);
    return result.rows;
  }

  /**
   * Valida se alunos existem no banco
   */
  async validarAlunos(alunosUuids: string[]): Promise<{ validos: string[], invalidos: string[] }> {
    if (alunosUuids.length === 0) {
      return { validos: [], invalidos: [] };
    }

    const result = await this.pool.query(
      `SELECT uuid FROM alunos WHERE uuid = ANY($1::uuid[])`,
      [alunosUuids],
    );

    const validos = result.rows.map(row => row.uuid);
    const invalidos = alunosUuids.filter(uuid => !validos.includes(uuid));

    return { validos, invalidos };
  }

  /**
   * Valida se professores existem no banco
   */
  async validarProfessores(professoresUuids: string[]): Promise<{ validos: string[], invalidos: string[] }> {
    if (professoresUuids.length === 0) {
      return { validos: [], invalidos: [] };
    }

    const result = await this.pool.query(
      `SELECT uuid FROM professores WHERE uuid = ANY($1::uuid[])`,
      [professoresUuids],
    );

    const validos = result.rows.map(row => row.uuid);
    const invalidos = professoresUuids.filter(uuid => !validos.includes(uuid));

    return { validos, invalidos };
  }

  /**
   * Busca informações completas de alunos para validação
   */
  async buscarAlunosParaValidacao(alunosUuids: string[]): Promise<any[]> {
    if (alunosUuids.length === 0) {
      return [];
    }

    const result = await this.pool.query(
      `SELECT 
        a.uuid,
        u.nome,
        u.email,
        u.avatar_url,
        a.matricula,
        c.nome as curso_nome,
        c.sigla as curso_sigla
       FROM alunos a
       INNER JOIN usuarios u ON a.usuario_uuid = u.uuid
       LEFT JOIN cursos c ON a.curso_uuid = c.uuid
       WHERE a.uuid = ANY($1::uuid[])`,
      [alunosUuids],
    );

    return result.rows;
  }

  /**
   * Busca informações completas de professores para validação
   */
  async buscarProfessoresParaValidacao(professoresUuids: string[]): Promise<any[]> {
    if (professoresUuids.length === 0) {
      return [];
    }

    const result = await this.pool.query(
      `SELECT 
        p.uuid,
        u.nome,
        u.email,
        u.avatar_url,
        d.nome as departamento_nome
       FROM professores p
       INNER JOIN usuarios u ON p.usuario_uuid = u.uuid
       LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
       WHERE p.uuid = ANY($1::uuid[])`,
      [professoresUuids],
    );

    return result.rows;
  }

  /**
   * Resolve usuários por email, retornando apenas alunos e professores
   */
  async resolverUsuariosPorEmail(emails: string[]): Promise<{
    alunos: { email: string; usuario_uuid: string; aluno_uuid: string; nome: string }[];
    professores: { email: string; usuario_uuid: string; professor_uuid: string; nome: string }[];
  }> {
    if (!emails || emails.length === 0) {
      return { alunos: [], professores: [] };
    }

    const normalized = emails.map(e => e.toLowerCase());

    const result = await this.pool.query(
      `SELECT
         u.email,
         u.uuid AS usuario_uuid,
         u.nome,
         u.tipo,
         a.uuid AS aluno_uuid,
         p.uuid AS professor_uuid
       FROM usuarios u
       LEFT JOIN alunos a ON a.usuario_uuid = u.uuid AND u.tipo = 'ALUNO'
       LEFT JOIN professores p ON p.usuario_uuid = u.uuid AND u.tipo = 'PROFESSOR'
       WHERE LOWER(u.email) = ANY($1::text[])`,
      [normalized],
    );

    const alunos = result.rows
      .filter(r => r.tipo === 'ALUNO' && r.aluno_uuid)
      .map(r => ({ email: r.email, usuario_uuid: r.usuario_uuid, aluno_uuid: r.aluno_uuid, nome: r.nome }));

    const professores = result.rows
      .filter(r => r.tipo === 'PROFESSOR' && r.professor_uuid)
      .map(r => ({ email: r.email, usuario_uuid: r.usuario_uuid, professor_uuid: r.professor_uuid, nome: r.nome }));

    return { alunos, professores };
  }
}
