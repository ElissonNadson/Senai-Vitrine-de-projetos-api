import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata data para formato relativo em português
 * Exemplos: "Há 2 dias", "Há 3 horas", "Há 1 mês"
 * 
 * @param date - Data a ser formatada (string ISO ou Date)
 * @returns String formatada em português com tempo relativo
 * 
 * @example
 * formatarDataRelativa('2025-11-15T10:00:00Z')
 * // Retorna: "Há 2 dias"
 * 
 * @example
 * formatarDataRelativa(new Date('2025-11-17T08:00:00Z'))
 * // Retorna: "Há 5 horas"
 */
export function formatarDataRelativa(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    const distancia = formatDistanceToNow(dateObj, {
      locale: ptBR,
      addSuffix: true, // Adiciona "há" ou "em"
    });
    
    return distancia;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

/**
 * Formata data para formato brasileiro completo
 * Exemplo: "17 de novembro de 2025 às 14:30"
 * 
 * @param date - Data a ser formatada (string ISO ou Date)
 * @returns String formatada em português brasileiro
 * 
 * @example
 * formatarDataCompleta('2025-11-17T14:30:00Z')
 * // Retorna: "17/11/2025 às 14:30"
 */
export function formatarDataCompleta(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    const dia = dateObj.getDate().toString().padStart(2, '0');
    const mes = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const ano = dateObj.getFullYear();
    const horas = dateObj.getHours().toString().padStart(2, '0');
    const minutos = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
  } catch (error) {
    console.error('Erro ao formatar data completa:', error);
    return 'Data inválida';
  }
}

/**
 * Formata data para formato brasileiro simples (sem hora)
 * Exemplo: "17/11/2025"
 * 
 * @param date - Data a ser formatada (string ISO ou Date)
 * @returns String formatada DD/MM/YYYY
 * 
 * @example
 * formatarDataSimples('2025-11-17T14:30:00Z')
 * // Retorna: "17/11/2025"
 */
export function formatarDataSimples(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    const dia = dateObj.getDate().toString().padStart(2, '0');
    const mes = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const ano = dateObj.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  } catch (error) {
    console.error('Erro ao formatar data simples:', error);
    return 'Data inválida';
  }
}

/**
 * Calcula diferença em dias entre duas datas
 * 
 * @param dataInicio - Data inicial
 * @param dataFim - Data final
 * @returns Número de dias entre as datas
 * 
 * @example
 * calcularDiferencaDias('2025-11-01', '2025-11-17')
 * // Retorna: 16
 */
export function calcularDiferencaDias(
  dataInicio: string | Date,
  dataFim: string | Date,
): number {
  try {
    const inicio =
      typeof dataInicio === 'string' ? parseISO(dataInicio) : dataInicio;
    const fim = typeof dataFim === 'string' ? parseISO(dataFim) : dataFim;

    const diferencaMs = fim.getTime() - inicio.getTime();
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    return diferencaDias;
  } catch (error) {
    console.error('Erro ao calcular diferença de dias:', error);
    return 0;
  }
}
