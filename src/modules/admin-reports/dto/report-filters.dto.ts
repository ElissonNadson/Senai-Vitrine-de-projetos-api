import { z } from 'zod';

export const ReportFiltersSchema = z.object({
  periodo_inicio: z.string().optional(),
  periodo_fim: z.string().optional(),
  departamento_uuid: z.string().uuid().optional(),
  status: z.enum(['RASCUNHO', 'PUBLICADO', 'DESATIVADO', 'ARQUIVADO']).optional(),
  fase_atual: z.enum(['IDEACAO', 'MODELAGEM', 'PROTOTIPAGEM', 'IMPLEMENTACAO']).optional(),
  curso: z.string().optional(),
  modalidade: z.string().optional(),
  turma: z.string().optional(),
  unidade_curricular: z.string().optional(),
});

export type ReportFilters = z.infer<typeof ReportFiltersSchema>;

export interface WhereClause {
  conditions: string[];
  params: any[];
  paramIndex: number;
}

export function buildWhereClause(filters: ReportFilters, tableAlias = 'p', startIndex = 1): WhereClause {
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = startIndex;

  if (filters.periodo_inicio) {
    conditions.push(`${tableAlias}.criado_em >= $${idx}`);
    params.push(filters.periodo_inicio);
    idx++;
  }
  if (filters.periodo_fim) {
    conditions.push(`${tableAlias}.criado_em <= $${idx}`);
    params.push(filters.periodo_fim);
    idx++;
  }
  if (filters.departamento_uuid) {
    conditions.push(`${tableAlias}.departamento_uuid = $${idx}`);
    params.push(filters.departamento_uuid);
    idx++;
  }
  if (filters.status) {
    conditions.push(`${tableAlias}.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }
  if (filters.fase_atual) {
    conditions.push(`${tableAlias}.fase_atual = $${idx}`);
    params.push(filters.fase_atual);
    idx++;
  }
  if (filters.curso) {
    conditions.push(`${tableAlias}.curso ILIKE $${idx}`);
    params.push(`%${filters.curso}%`);
    idx++;
  }
  if (filters.modalidade) {
    conditions.push(`${tableAlias}.modalidade = $${idx}`);
    params.push(filters.modalidade);
    idx++;
  }
  if (filters.turma) {
    conditions.push(`${tableAlias}.turma ILIKE $${idx}`);
    params.push(`%${filters.turma}%`);
    idx++;
  }
  if (filters.unidade_curricular) {
    conditions.push(`${tableAlias}.unidade_curricular ILIKE $${idx}`);
    params.push(`%${filters.unidade_curricular}%`);
    idx++;
  }

  return { conditions, params, paramIndex: idx };
}
