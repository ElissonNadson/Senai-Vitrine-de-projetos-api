import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DashboardDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  /**
   * Dashboard do Aluno
   */
  async getDashboardAluno(usuarioUuid: string): Promise<any> {
    // Busca informações do aluno
    const alunoResult = await this.pool.query(
      `SELECT a.*, c.nome as curso_nome, c.sigla as curso_sigla,
              t.codigo as turma_codigo, t.ano as turma_ano, t.semestre as turma_semestre
       FROM alunos a
       LEFT JOIN cursos c ON a.curso_uuid = c.uuid
       LEFT JOIN turmas t ON a.turma_uuid = t.uuid
       WHERE a.usuario_uuid = $1`,
      [usuarioUuid],
    );

    if (alunoResult.rows.length === 0) {
      return null;
    }

    const aluno = alunoResult.rows[0];

    // Projetos onde é líder ou autor
    const projetosResult = await this.pool.query(
      `SELECT p.uuid, p.titulo, p.fase_atual, p.criado_em,
              (SELECT COUNT(*) FROM projetos_alunos pa2 WHERE pa2.projeto_uuid = p.uuid) as total_autores
       FROM projetos p
       INNER JOIN projetos_alunos pa ON p.uuid = pa.projeto_uuid
       WHERE pa.aluno_uuid = $1
       ORDER BY p.criado_em DESC
       LIMIT 10`,
      [aluno.uuid],
    );

    // Contadores
    const contagensResult = await this.pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM projetos_alunos WHERE aluno_uuid = $1 AND papel = 'LIDER') as projetos_lider,
         (SELECT COUNT(*) FROM projetos_alunos WHERE aluno_uuid = $1 AND papel = 'AUTOR') as projetos_autor,
         (SELECT COUNT(DISTINCT p.uuid) 
          FROM projetos p 
          INNER JOIN projetos_alunos pa ON p.uuid = pa.projeto_uuid 
          WHERE pa.aluno_uuid = $1 AND p.fase_atual = 'EM_DESENVOLVIMENTO') as projetos_andamento,
         (SELECT COUNT(DISTINCT p.uuid) 
          FROM projetos p 
          INNER JOIN projetos_alunos pa ON p.uuid = pa.projeto_uuid 
          WHERE pa.aluno_uuid = $1 AND p.fase_atual = 'CONCLUIDO') as projetos_concluidos`,
      [aluno.uuid],
    );

    return {
      aluno: {
        nome: aluno.nome,
        matricula: aluno.matricula,
        curso: aluno.curso_nome,
        curso_sigla: aluno.curso_sigla,
        turma: aluno.turma_codigo,
      },
      projetos: projetosResult.rows,
      estatisticas: contagensResult.rows[0],
    };
  }

  /**
   * Dashboard do Professor
   */
  async getDashboardProfessor(usuarioUuid: string): Promise<any> {
    // Busca informações do professor
    const professorResult = await this.pool.query(
      `SELECT p.*, d.nome as departamento_nome, d.cor as departamento_cor
       FROM professores p
       LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
       WHERE p.usuario_uuid = $1`,
      [usuarioUuid],
    );

    if (professorResult.rows.length === 0) {
      return null;
    }

    const professor = professorResult.rows[0];

    // Projetos orientados
    const projetosResult = await this.pool.query(
      `SELECT p.uuid, p.titulo, p.fase_atual, p.criado_em,
              (SELECT COUNT(*) FROM projetos_alunos pa WHERE pa.projeto_uuid = p.uuid) as total_autores,
              (SELECT COUNT(*) FROM etapas_projeto ep WHERE ep.projeto_uuid = p.uuid AND ep.status = 'PENDENTE_ORIENTADOR') as pendencias
       FROM projetos p
       INNER JOIN projetos_professores pp ON p.uuid = pp.projeto_uuid
       WHERE pp.professor_uuid = $1
       ORDER BY p.criado_em DESC
       LIMIT 10`,
      [professor.uuid],
    );

    // Contadores
    const contagensResult = await this.pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM projetos_professores WHERE professor_uuid = $1) as total_orientacoes,
         (SELECT COUNT(DISTINCT p.uuid) 
          FROM projetos p 
          INNER JOIN projetos_professores pp ON p.uuid = pp.projeto_uuid 
          WHERE pp.professor_uuid = $1 AND p.fase_atual = 'EM_DESENVOLVIMENTO') as orientacoes_andamento,
         (SELECT COUNT(*) 
          FROM etapas_projeto ep
          INNER JOIN projetos_professores pp ON ep.projeto_uuid = pp.projeto_uuid
          WHERE pp.professor_uuid = $1 AND ep.status = 'PENDENTE_ORIENTADOR') as pendencias_feedback`,
      [professor.uuid],
    );

    return {
      professor: {
        nome: professor.nome,
        departamento: professor.departamento_nome,
        departamento_cor: professor.departamento_cor,
      },
      projetos: projetosResult.rows,
      estatisticas: contagensResult.rows[0],
    };
  }

  /**
   * Dashboard do Admin
   */
  async getDashboardAdmin(): Promise<any> {
    // Estatísticas gerais
    const estatisticasResult = await this.pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM projetos WHERE fase_atual != 'RASCUNHO') as total_projetos,
        (SELECT COUNT(*) FROM usuarios WHERE tipo = 'ALUNO' AND ativo = TRUE) as total_alunos,
        (SELECT COUNT(*) FROM usuarios WHERE tipo = 'PROFESSOR' AND ativo = TRUE) as total_professores,
        (SELECT COUNT(*) FROM departamentos) as total_departamentos,
        (SELECT COUNT(*) FROM cursos WHERE ativo = TRUE) as total_cursos
    `);

    // Projetos por fase
    const projetosPorFaseResult = await this.pool.query(`
      SELECT 
        fase_atual,
        COUNT(*) as total
      FROM projetos
      WHERE fase_atual != 'RASCUNHO'
      GROUP BY fase_atual
      ORDER BY 
        CASE fase_atual
          WHEN 'PLANEJAMENTO' THEN 1
          WHEN 'EM_DESENVOLVIMENTO' THEN 2
          WHEN 'EM_TESTE' THEN 3
          WHEN 'AGUARDANDO_REVISAO' THEN 4
          WHEN 'CONCLUIDO' THEN 5
          ELSE 6
        END
    `);

    // Projetos por departamento
    const projetosPorDepartamentoResult = await this.pool.query(`
      SELECT 
        d.nome,
        d.cor,
        COUNT(p.uuid) as total_projetos
      FROM departamentos d
      LEFT JOIN projetos p ON d.uuid = p.departamento_uuid
      GROUP BY d.uuid, d.nome, d.cor
      ORDER BY total_projetos DESC
    `);

    // Projetos recentes
    const projetosRecentesResult = await this.pool.query(`
      SELECT 
        p.uuid,
        p.titulo,
        p.fase_atual,
        p.criado_em,
        d.nome as departamento,
        (SELECT COUNT(*) FROM projetos_alunos pa WHERE pa.projeto_uuid = p.uuid) as total_autores
      FROM projetos p
      LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
      WHERE p.fase_atual != 'RASCUNHO'
      ORDER BY p.criado_em DESC
      LIMIT 10
    `);

    return {
      estatisticas: estatisticasResult.rows[0],
      projetos_por_fase: projetosPorFaseResult.rows,
      projetos_por_departamento: projetosPorDepartamentoResult.rows,
      projetos_recentes: projetosRecentesResult.rows,
    };
  }
}
