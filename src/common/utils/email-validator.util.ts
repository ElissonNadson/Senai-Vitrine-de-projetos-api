/**
 * Validador de emails SENAI-BA
 * Valida domínios específicos para alunos e professores
 */

/**
 * Regex para validação de email de alunos SENAI-BA
 * Domínio permitido: @ba.estudante.senai.br
 */
const REGEX_EMAIL_ALUNO = /^[a-zA-Z0-9._-]+@ba\.estudante\.senai\.br$/;

/**
 * Regex para validação de email de professores/admin SENAI-BA
 * Domínios permitidos: @ba.senai.br e @ba.docente.senai.br
 */
const REGEX_EMAIL_PROFESSOR = /^[a-zA-Z0-9._-]+@ba\.senai\.br$/;
const REGEX_EMAIL_DOCENTE = /^[a-zA-Z0-9._-]+@ba\.docente\.senai\.br$/;

/**
 * Emails permitidos externamente (Admins/Convidados)
 */
const EMAILS_PERMITIDOS = [
  'nadsonnodachi@gmail.com',
  'ingridbarretoap@gmail.com',
  'admin@admin.com',
  'senaifeira@senaifeira'
];

/**
 * Domínios bloqueados (emails pessoais e outros estados)
 */
const DOMINIOS_BLOQUEADOS = [
  '@gmail.com',
  '@hotmail.com',
  '@outlook.com',
  '@yahoo.com',
  '@live.com',
  '@icloud.com',
  '@senai.sp.br',
  '@senai.rj.br',
  '@senai.mg.br',
  '@senai.pr.br',
  '@senai.rs.br',
  '@senai.sc.br',
  '@senai.ce.br',
  '@senai.pe.br',
  '@senai.go.br',
  '@senai.df.br',
];

/**
 * Tipo de usuário baseado no domínio do email
 */
export enum TipoUsuario {
  ALUNO = 'ALUNO',
  PROFESSOR = 'PROFESSOR',
  INVALIDO = 'INVALIDO',
}

/**
 * Valida se o email é de um aluno SENAI-BA
 * 
 * @param email - Email a ser validado
 * @returns true se for email de aluno válido
 * 
 * @example
 * validarEmailAluno('joao.silva@ba.estudante.senai.br')
 * // Retorna: true
 * 
 * @example
 * validarEmailAluno('joao@gmail.com')
 * // Retorna: false
 */
export function validarEmailAluno(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailLowerCase = email.toLowerCase().trim();
  return REGEX_EMAIL_ALUNO.test(emailLowerCase);
}

/**
 * Valida se o email é de um professor/admin SENAI-BA
 * 
 * @param email - Email a ser validado
 * @returns true se for email de professor/admin válido
 * 
 * @example
 * validarEmailProfessor('carlos.santos@ba.senai.br')
 * // Retorna: true
 * 
 * @example
 * validarEmailProfessor('carlos@gmail.com')
 * // Retorna: false
 */
export function validarEmailProfessor(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailLowerCase = email.toLowerCase().trim();

  if (EMAILS_PERMITIDOS.includes(emailLowerCase)) {
    return true;
  }

  return REGEX_EMAIL_PROFESSOR.test(emailLowerCase) || REGEX_EMAIL_DOCENTE.test(emailLowerCase);
}

/**
 * Verifica se o email está em um domínio bloqueado
 * 
 * @param email - Email a ser verificado
 * @returns true se o domínio está bloqueado
 * 
 * @example
 * verificarDominioBloqueado('usuario@gmail.com')
 * // Retorna: true
 * 
 * @example
 * verificarDominioBloqueado('aluno@ba.estudante.senai.br')
 * // Retorna: false
 */
export function verificarDominioBloqueado(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailLowerCase = email.toLowerCase().trim();

  return DOMINIOS_BLOQUEADOS.some(dominio =>
    emailLowerCase.endsWith(dominio),
  );
}

/**
 * Detecta o tipo de usuário baseado no domínio do email
 * 
 * @param email - Email a ser analisado
 * @returns Tipo do usuário (ALUNO, PROFESSOR ou INVALIDO)
 * 
 * @example
 * detectarTipoUsuario('aluno@ba.estudante.senai.br')
 * // Retorna: TipoUsuario.ALUNO
 * 
 * @example
 * detectarTipoUsuario('professor@ba.senai.br')
 * // Retorna: TipoUsuario.PROFESSOR
 * 
 * @example
 * detectarTipoUsuario('usuario@gmail.com')
 * // Retorna: TipoUsuario.INVALIDO
 */
export function detectarTipoUsuario(email: string): TipoUsuario {
  if (!email || typeof email !== 'string') {
    return TipoUsuario.INVALIDO;
  }

  if (validarEmailAluno(email)) {
    return TipoUsuario.ALUNO;
  }

  if (validarEmailProfessor(email)) {
    return TipoUsuario.PROFESSOR;
  }

  return TipoUsuario.INVALIDO;
}

/**
 * Valida email SENAI-BA (aluno ou professor)
 * 
 * @param email - Email a ser validado
 * @returns true se for email SENAI-BA válido (aluno ou professor)
 * 
 * @example
 * validarEmailSenai('aluno@ba.estudante.senai.br')
 * // Retorna: true
 * 
 * @example
 * validarEmailSenai('professor@ba.senai.br')
 * // Retorna: true
 * 
 * @example
 * validarEmailSenai('usuario@gmail.com')
 * // Retorna: false
 */
export function validarEmailSenai(email: string): boolean {
  return validarEmailAluno(email) || validarEmailProfessor(email);
}

/**
 * Censura parte do email para exibição pública
 * Exemplo: joao.silva@ba.estudante.senai.br → j***a@ba.estudante.senai.br
 * 
 * @param email - Email a ser censurado
 * @returns Email com parte do nome censurada
 * 
 * @example
 * censurarEmail('joao.silva@ba.estudante.senai.br')
 * // Retorna: "j***a@ba.estudante.senai.br"
 * 
 * @example
 * censurarEmail('prof.carlos@ba.senai.br')
 * // Retorna: "p***s@ba.senai.br"
 */
export function censurarEmail(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '***@***';
  }

  const [nome, dominio] = email.split('@');

  if (nome.length <= 2) {
    return `***@${dominio}`;
  }

  const primeiraLetra = nome.charAt(0);
  const ultimaLetra = nome.charAt(nome.length - 1);

  return `${primeiraLetra}***${ultimaLetra}@${dominio}`;
}

/**
 * Extrai o nome de usuário do email (parte antes do @)
 * 
 * @param email - Email completo
 * @returns Nome de usuário extraído
 * 
 * @example
 * extrairNomeUsuario('joao.silva@ba.estudante.senai.br')
 * // Retorna: "joao.silva"
 */
export function extrairNomeUsuario(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '';
  }

  return email.split('@')[0];
}
