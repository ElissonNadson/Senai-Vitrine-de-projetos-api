const map: Record<string, string> = {
  PROJETO_CRIADO: 'Projeto criado',
  VINCULO_ADICIONADO: 'Você foi adicionado ao projeto',
  PROJETO_PUBLICADO: 'Projeto publicado',
  PROJETO_ATUALIZADO: 'Projeto atualizado',
  SOLICITACAO_DESATIVACAO: 'Solicitação de desativação',
  SOLICITACAO_DECISAO: 'Solicitação de desativação',
};

export function assuntoPorTipo(tipo: string): string {
  return map[tipo] || tipo;
}
