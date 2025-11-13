import { z } from "zod";

/** regex */
const brDate = /^\d{2}\/\d{2}\/\d{4}$/;
const brCpf  = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const phone  = /^\(?\d{2}\)?\s?\d{4,5}-\d{4}$/;
const time   = /^([01]\d|2[0-3]):[0-5]\d$/;

/** helpers */
const parseBrDateToISO = (d: string) => {
  const [dd, mm, yyyy] = d.split("/");
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
};

//tabulacao_uuid, acao, matricula_usuario, login_usuario, nome_usuario, funcao_usuario

/** N1 (tabela base) */
export const AuditoriaSchema = z.object({
  // dados “comerciais”
  tabulacaoUuid: z.string().uuid("UUID inválido"),
  acao: z.string().min(1).max(200),
  nomeUsuario: z.string().min(1).optional(),
  matriculaUsuario: z.string().min(1).optional(),
  loginUsuario: z.string().optional().optional(),    // será sobrescrito pelo cookie
  funcaoUsuario: z.string().optional().optional()
});

export type CreateAuditoriaDto = z.infer<typeof AuditoriaSchema>;


export class CreateAuditoriaZodDto {
  static schema = AuditoriaSchema;
}