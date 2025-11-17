import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

/**
 * DTO para resposta de autenticação
 */
export class AuthResponseDto {
  token: string;
  usuario: {
    uuid: string;
    nome: string;
    email: string;
    tipo: string;
    avatarUrl?: string;
    primeiroAcesso: boolean;
  };
}

/**
 * DTO para refresh token
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;
}

/**
 * DTO para usuário do Google OAuth
 */
export class GoogleUserDto {
  googleId: string;
  email: string;
  nome: string;
  primeiroNome: string;
  sobrenome: string;
  avatarUrl?: string;
  tipo: string;
  accessToken: string;
}
