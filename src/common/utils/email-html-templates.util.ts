/**
 * Templates HTML estilizados para emails de notificação do sistema Vitrine SENAI.
 */

const SENAI_BLUE = '#003087';
const SENAI_RED = '#E30613';
const BG_GRAY = '#f4f6f8';
const TEXT_DARK = '#1a1a2e';
const TEXT_MUTED = '#555';

function baseLayout(titulo: string, corpo: string, linkUrl?: string, linkTexto?: string): string {
  const botao = linkUrl
    ? `<tr><td style="padding:24px 30px 0">
        <a href="${escapeHtml(linkUrl)}" style="display:inline-block;padding:12px 28px;background:${SENAI_BLUE};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">${escapeHtml(linkTexto || 'Ver detalhes')}</a>
       </td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG_GRAY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_GRAY};padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <!-- Header -->
    <tr><td style="background:${SENAI_BLUE};padding:20px 30px">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Vitrine de Projetos SENAI-BA</h1>
    </td></tr>
    <!-- Título -->
    <tr><td style="padding:28px 30px 8px">
      <h2 style="margin:0;color:${TEXT_DARK};font-size:18px;font-weight:600">${escapeHtml(titulo)}</h2>
    </td></tr>
    <!-- Corpo -->
    <tr><td style="padding:12px 30px;color:${TEXT_DARK};font-size:14px;line-height:1.7">
      ${corpo}
    </td></tr>
    ${botao}
    <!-- Footer -->
    <tr><td style="padding:28px 30px 20px;border-top:1px solid #eee;margin-top:20px">
      <p style="margin:0;color:${TEXT_MUTED};font-size:12px;line-height:1.5">
        Este é um email automático do sistema Vitrine de Projetos SENAI-BA.<br>
        Por favor, não responda a este email.
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Templates por tipo ──────────────────────────────────────────

export function emailProjetoCriado(projetoTitulo: string, linkProjeto?: string): string {
  return baseLayout(
    'Projeto criado com sucesso!',
    `<p>O projeto <strong>${escapeHtml(projetoTitulo)}</strong> foi criado e está salvo como rascunho.</p>
     <p>Continue preenchendo as informações para publicá-lo na vitrine.</p>`,
    linkProjeto,
    'Ir para o projeto',
  );
}

export function emailProjetoAtualizado(
  projetoTitulo: string,
  camposAlterados: string,
  linkProjeto?: string,
): string {
  const linhas = camposAlterados
    .split('\n')
    .filter(Boolean)
    .map((l) => `<li style="margin-bottom:6px">${escapeHtml(l)}</li>`)
    .join('');

  return baseLayout(
    'Projeto atualizado',
    `<p>O projeto <strong>${escapeHtml(projetoTitulo)}</strong> foi atualizado.</p>
     ${linhas ? `<p style="font-weight:600;margin-bottom:4px">Campos alterados:</p><ul style="padding-left:20px;color:${TEXT_DARK}">${linhas}</ul>` : ''}`,
    linkProjeto,
    'Ver projeto',
  );
}

export function emailProjetoPublicado(projetoTitulo: string, linkProjeto?: string): string {
  return baseLayout(
    'Projeto publicado!',
    `<p>O projeto <strong>${escapeHtml(projetoTitulo)}</strong> foi publicado e agora está visível na vitrine para todos.</p>`,
    linkProjeto,
    'Ver na vitrine',
  );
}

export function emailVinculoAdicionado(projetoTitulo: string, papel: string, linkProjeto?: string): string {
  return baseLayout(
    'Você foi adicionado a um projeto',
    `<p>Você foi adicionado como <strong>${escapeHtml(papel)}</strong> no projeto <strong>${escapeHtml(projetoTitulo)}</strong>.</p>
     <p>Acesse o projeto para ver os detalhes.</p>`,
    linkProjeto,
    'Ver projeto',
  );
}

export function emailVinculoRemovido(projetoTitulo: string, linkProjeto?: string): string {
  return baseLayout(
    'Você foi removido de um projeto',
    `<p>Você foi removido do projeto <strong>${escapeHtml(projetoTitulo)}</strong>.</p>
     <p>Se acredita que isso foi um engano, entre em contato com o líder do projeto ou orientador.</p>`,
    linkProjeto,
  );
}

export function emailSolicitacaoDesativacao(
  projetoTitulo: string,
  solicitanteNome: string,
  motivo: string,
  linkProjeto?: string,
): string {
  return baseLayout(
    'Solicitação de desativação',
    `<p>O projeto <strong>${escapeHtml(projetoTitulo)}</strong> recebeu uma solicitação de desativação.</p>
     <p><strong>Solicitante:</strong> ${escapeHtml(solicitanteNome)}</p>
     ${motivo ? `<p><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>` : ''}`,
    linkProjeto,
    'Ver projeto',
  );
}

export function emailSolicitacaoDecisao(
  projetoTitulo: string,
  aceita: boolean,
  linkProjeto?: string,
): string {
  const statusTexto = aceita ? 'aceita' : 'rejeitada';
  const cor = aceita ? SENAI_RED : SENAI_BLUE;

  return baseLayout(
    `Solicitação de desativação ${statusTexto}`,
    `<p>Sua solicitação de desativação do projeto <strong>${escapeHtml(projetoTitulo)}</strong> foi
     <span style="color:${cor};font-weight:600">${statusTexto}</span>.</p>`,
    linkProjeto,
    'Ver projeto',
  );
}

export function emailProjetoArquivado(projetoTitulo: string): string {
  return baseLayout(
    'Projeto arquivado',
    `<p>O projeto <strong>${escapeHtml(projetoTitulo)}</strong> foi arquivado e não está mais visível na vitrine.</p>`,
  );
}

/**
 * Retorna o HTML estilizado baseado no tipo da notificação.
 * Cai para o template genérico caso o tipo não tenha template específico.
 */
export function gerarHtmlEmail(
  tipo: string,
  mensagem: string,
  linkRelacionado?: string,
  extras?: Record<string, any>,
): string {
  const titulo = extras?.projetoTitulo || '';

  switch (tipo) {
    case 'PROJETO_CRIADO':
      return emailProjetoCriado(titulo, linkRelacionado);

    case 'PROJETO_ATUALIZADO':
      return emailProjetoAtualizado(titulo, extras?.diff || mensagem, linkRelacionado);

    case 'PROJETO_PUBLICADO':
      return emailProjetoPublicado(titulo, linkRelacionado);

    case 'VINCULO_ADICIONADO':
      return emailVinculoAdicionado(titulo, extras?.papel || 'membro', linkRelacionado);

    case 'VINCULO_REMOVIDO':
      return emailVinculoRemovido(titulo, linkRelacionado);

    case 'SOLICITACAO_DESATIVACAO':
      return emailSolicitacaoDesativacao(
        titulo,
        extras?.solicitanteNome || 'Usuário',
        extras?.motivo || '',
        linkRelacionado,
      );

    case 'SOLICITACAO_DECISAO':
      return emailSolicitacaoDecisao(titulo, extras?.aceita ?? false, linkRelacionado);

    case 'PROJETO_ARQUIVADO':
      return emailProjetoArquivado(titulo);

    default:
      return baseLayout(
        tipo.replace(/_/g, ' '),
        `<p>${mensagem.replace(/\n/g, '<br/>')}</p>`,
        linkRelacionado,
        'Ver detalhes',
      );
  }
}
