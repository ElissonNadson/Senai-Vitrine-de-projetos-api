// DTOs para o módulo de sessões
export interface SessaoDTO {
  uuid: string;
  usuario_uuid: string;
  ip_address: string | null;
  user_agent: string | null;
  navegador: string | null;
  sistema_operacional: string | null;
  dispositivo: string | null;
  localizacao: string | null;
  criado_em: Date;
  ultimo_acesso: Date;
  expira_em: Date;
  ativo: boolean;
  is_current?: boolean; // Flag para identificar a sessão atual
}

export interface CriarSessaoDTO {
  usuario_uuid: string;
  token_hash: string;
  ip_address?: string;
  user_agent?: string;
  navegador?: string;
  sistema_operacional?: string;
  dispositivo?: string;
  localizacao?: string;
  expira_em: Date;
}

export interface SessaoResponseDTO {
  uuid: string;
  navegador: string;
  sistema_operacional: string;
  dispositivo: string;
  localizacao: string;
  ip_mascarado: string;
  criado_em: string;
  ultimo_acesso: string;
  is_current: boolean;
}

export interface ListaSessoesResponseDTO {
  sessoes: SessaoResponseDTO[];
  total: number;
}
