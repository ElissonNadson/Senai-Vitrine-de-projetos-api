export interface JwtPayload {
  primeiroAcesso: boolean;
  uuid: string;
  email: string;
  tipo: 'ALUNO' | 'PROFESSOR' | 'ADMIN';
  nome: string;
  googleId?: string;
  iat: number;
  exp: number;
}
