import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class ProgressaoDao {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  /**
   * Registra log de progressão de fase
   */
  async registrarProgressao(
    projetoUuid: string,
    faseAnterior: string,
    faseNova: string,
    motivo: string,
    alteradoPorUuid: string,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `INSERT INTO progressao_fases_log (
        projeto_uuid, fase_anterior, fase_nova, motivo, alterado_por_uuid
      ) VALUES ($1, $2, $3, $4, $5)`,
      [projetoUuid, faseAnterior, faseNova, motivo, alteradoPorUuid],
    );
  }

  /**
   * Busca histórico de progressões do projeto
   */
  async buscarHistorico(projetoUuid: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT p.*, u.nome as alterado_por_nome
       FROM progressao_fases_log p
       LEFT JOIN usuarios u ON p.alterado_por_uuid = u.uuid
       WHERE p.projeto_uuid = $1
       ORDER BY p.criado_em DESC`,
      [projetoUuid],
    );

    return result.rows;
  }

  /**
   * Atualiza fase do projeto
   */
  async atualizarFase(
    projetoUuid: string,
    novaFase: string,
    client?: PoolClient,
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      'UPDATE projetos SET fase_atual = $1 WHERE uuid = $2',
      [novaFase, projetoUuid],
    );
  }

  /**
   * Verifica se projeto pode progredir automaticamente
   */
  async verificarCondicaoProgressao(projetoUuid: string): Promise<{
    podeProgredir: boolean;
    faseAtual: string;
    proximaFase: string | null;
    motivo: string;
  }> {
    // Busca fase atual
    const projetoResult = await this.pool.query(
      'SELECT fase_atual FROM projetos WHERE uuid = $1',
      [projetoUuid],
    );

    if (projetoResult.rows.length === 0) {
      return {
        podeProgredir: false,
        faseAtual: 'DESCONHECIDO',
        proximaFase: null,
        motivo: 'Projeto não encontrado',
      };
    }

    const faseAtual = projetoResult.rows[0].fase_atual;

    // Rascunhos não progridem automaticamente
    if (faseAtual === 'RASCUNHO') {
      return {
        podeProgredir: false,
        faseAtual,
        proximaFase: null,
        motivo: 'Projetos em rascunho não progridem automaticamente',
      };
    }

    // Projetos concluídos não progridem
    if (faseAtual === 'CONCLUIDO' || faseAtual === 'ARQUIVADO' || faseAtual === 'DESATIVADO') {
      return {
        podeProgredir: false,
        faseAtual,
        proximaFase: null,
        motivo: 'Projeto já está finalizado',
      };
    }

    // Conta etapas pendentes de feedback
    const etapasPendentesResult = await this.pool.query(
      `SELECT COUNT(*) as total 
       FROM etapas_projeto 
       WHERE projeto_uuid = $1 AND status IN ('EM_ANDAMENTO', 'PENDENTE_ORIENTADOR', 'EM_REVISAO')`,
      [projetoUuid],
    );

    const etapasPendentes = parseInt(etapasPendentesResult.rows[0].total, 10);

    if (etapasPendentes > 0) {
      return {
        podeProgredir: false,
        faseAtual,
        proximaFase: null,
        motivo: `${etapasPendentes} etapa(s) ainda em andamento`,
      };
    }

    // Conta etapas concluídas
    const etapasConcluidasResult = await this.pool.query(
      `SELECT COUNT(*) as total 
       FROM etapas_projeto 
       WHERE projeto_uuid = $1 AND status = 'CONCLUIDA'`,
      [projetoUuid],
    );

    const etapasConcluidas = parseInt(etapasConcluidasResult.rows[0].total, 10);

    // Define progressão baseada na fase atual
    const progressoes: Record<string, { proxima: string; minimoEtapas: number }> = {
      PLANEJAMENTO: { proxima: 'EM_DESENVOLVIMENTO', minimoEtapas: 2 },
      EM_DESENVOLVIMENTO: { proxima: 'EM_TESTE', minimoEtapas: 3 },
      EM_TESTE: { proxima: 'AGUARDANDO_REVISAO', minimoEtapas: 2 },
      AGUARDANDO_REVISAO: { proxima: 'CONCLUIDO', minimoEtapas: 1 },
    };

    const config = progressoes[faseAtual];

    if (!config) {
      return {
        podeProgredir: false,
        faseAtual,
        proximaFase: null,
        motivo: 'Fase atual não permite progressão automática',
      };
    }

    if (etapasConcluidas < config.minimoEtapas) {
      return {
        podeProgredir: false,
        faseAtual,
        proximaFase: config.proxima,
        motivo: `Mínimo de ${config.minimoEtapas} etapa(s) concluída(s) necessárias. Atual: ${etapasConcluidas}`,
      };
    }

    return {
      podeProgredir: true,
      faseAtual,
      proximaFase: config.proxima,
      motivo: `Todas as ${etapasConcluidas} etapa(s) concluídas`,
    };
  }
}
