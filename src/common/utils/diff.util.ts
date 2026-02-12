export function formatarDiff(
  anteriores: Record<string, any>,
  novos: Record<string, any>,
  campos?: string[],
  labels?: Record<string, string>,
): string {
  const keys = campos && campos.length > 0 ? campos : Array.from(new Set([...Object.keys(anteriores || {}), ...Object.keys(novos || {})]));
  const linhas: string[] = [];
  for (const k of keys) {
    const a = (anteriores || {})[k];
    const n = (novos || {})[k];
    const eq = JSON.stringify(a) === JSON.stringify(n);
    if (eq) continue;
    const nome = labels && labels[k] ? labels[k] : k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    linhas.push(`Houve mudança em: ${nome}`);
  }
  return linhas.join('\n');
}

export function diffLista(
  anteriores: string[],
  atuais: string[],
): { adicionados: string[]; removidos: string[] } {
  const prev = new Set((anteriores || []).map(String));
  const curr = new Set((atuais || []).map(String));
  const adicionados: string[] = [];
  const removidos: string[] = [];
  for (const x of curr) if (!prev.has(x)) adicionados.push(x);
  for (const x of prev) if (!curr.has(x)) removidos.push(x);
  return { adicionados, removidos };
}
