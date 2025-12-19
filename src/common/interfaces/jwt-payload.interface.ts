export interface JwtPayload {
  primeiroAcesso: boolean;
  uuid: string;
  email: string;
  tipo: 'ALUNO' | 'DOCENTE' | 'ADMIN';
  nome: string;
  googleId?: string;
  iat?: number;
  exp?: number;
  userAgent?: string;
  ip?: string;
}
