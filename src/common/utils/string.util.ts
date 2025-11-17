/**
 * Utilitários para manipulação de strings
 */

/**
 * Remove acentos de uma string
 * 
 * @param texto - Texto com acentos
 * @returns Texto sem acentos
 * 
 * @example
 * removerAcentos('São Paulo')
 * // Retorna: "Sao Paulo"
 */
export function removerAcentos(texto: string): string {
  if (!texto) return '';
  
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Converte string para slug (URL-friendly)
 * 
 * @param texto - Texto a ser convertido
 * @returns String slug formatada
 * 
 * @example
 * gerarSlug('Sistema de Automação Industrial')
 * // Retorna: "sistema-de-automacao-industrial"
 */
export function gerarSlug(texto: string): string {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim
}

/**
 * Trunca texto com reticências
 * 
 * @param texto - Texto a ser truncado
 * @param tamanhoMaximo - Tamanho máximo do texto
 * @returns Texto truncado com "..."
 * 
 * @example
 * truncar('Este é um texto muito longo', 15)
 * // Retorna: "Este é um te..."
 */
export function truncar(texto: string, tamanhoMaximo: number): string {
  if (!texto || texto.length <= tamanhoMaximo) {
    return texto;
  }
  
  return texto.substring(0, tamanhoMaximo) + '...';
}

/**
 * Capitaliza primeira letra de cada palavra
 * 
 * @param texto - Texto a ser capitalizado
 * @returns Texto com primeiras letras maiúsculas
 * 
 * @example
 * capitalizarPalavras('joão silva santos')
 * // Retorna: "João Silva Santos"
 */
export function capitalizarPalavras(texto: string): string {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

/**
 * Sanitiza HTML removendo tags perigosas
 * Nota: Para sanitização completa, usar biblioteca DOMPurify no frontend
 * 
 * @param html - HTML a ser sanitizado
 * @returns HTML básico sanitizado
 * 
 * @example
 * sanitizarHTML('<script>alert("XSS")</script><p>Texto</p>')
 * // Retorna: "<p>Texto</p>"
 */
export function sanitizarHTML(html: string): string {
  if (!html) return '';
  
  // Remove scripts, iframes e outras tags perigosas
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
}

/**
 * Valida formato de telefone brasileiro
 * Formato esperado: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * 
 * @param telefone - Telefone a ser validado
 * @returns true se formato é válido
 * 
 * @example
 * validarTelefone('(71) 98765-4321')
 * // Retorna: true
 */
export function validarTelefone(telefone: string): boolean {
  if (!telefone) return false;
  
  // Regex para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  const regex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
  return regex.test(telefone);
}

/**
 * Formata telefone para padrão brasileiro
 * 
 * @param telefone - Números do telefone
 * @returns Telefone formatado
 * 
 * @example
 * formatarTelefone('71987654321')
 * // Retorna: "(71) 98765-4321"
 */
export function formatarTelefone(telefone: string): string {
  if (!telefone) return '';
  
  // Remove tudo que não é número
  const numeros = telefone.replace(/\D/g, '');
  
  // Verifica se tem 10 ou 11 dígitos
  if (numeros.length === 11) {
    // (XX) XXXXX-XXXX
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
  } else if (numeros.length === 10) {
    // (XX) XXXX-XXXX
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
  }
  
  return telefone;
}

/**
 * Valida formato de matrícula (mínimo 5, máximo 20 caracteres alfanuméricos)
 * 
 * @param matricula - Matrícula a ser validada
 * @returns true se formato é válido
 * 
 * @example
 * validarMatricula('202401234')
 * // Retorna: true
 */
export function validarMatricula(matricula: string): boolean {
  if (!matricula) return false;
  
  // Mínimo 5, máximo 20 caracteres alfanuméricos
  const regex = /^[a-zA-Z0-9]{5,20}$/;
  return regex.test(matricula);
}

/**
 * Remove espaços duplicados e trim
 * 
 * @param texto - Texto a ser limpo
 * @returns Texto sem espaços duplicados
 * 
 * @example
 * limparEspacos('  Texto   com    espaços  ')
 * // Retorna: "Texto com espaços"
 */
export function limparEspacos(texto: string): string {
  if (!texto) return '';
  
  return texto
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Extrai números de uma string
 * 
 * @param texto - Texto contendo números
 * @returns String apenas com números
 * 
 * @example
 * extrairNumeros('ABC-123-XYZ-456')
 * // Retorna: "123456"
 */
export function extrairNumeros(texto: string): string {
  if (!texto) return '';
  
  return texto.replace(/\D/g, '');
}

/**
 * Gera string aleatória
 * 
 * @param tamanho - Tamanho da string
 * @returns String aleatória
 * 
 * @example
 * gerarStringAleatoria(8)
 * // Retorna: "a7k2m9x4"
 */
export function gerarStringAleatoria(tamanho: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + tamanho);
}

/**
 * Valida URL
 * 
 * @param url - URL a ser validada
 * @returns true se URL é válida
 * 
 * @example
 * validarURL('https://github.com/usuario')
 * // Retorna: true
 */
export function validarURL(url: string): boolean {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Escapa caracteres especiais para uso em regex
 * 
 * @param texto - Texto a ser escapado
 * @returns Texto com caracteres especiais escapados
 * 
 * @example
 * escaparRegex('R$ 10.50')
 * // Retorna: "R\\$ 10\\.50"
 */
export function escaparRegex(texto: string): string {
  if (!texto) return '';
  
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
