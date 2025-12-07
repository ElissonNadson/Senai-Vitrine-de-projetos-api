import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsUrl,
  Matches,
} from 'class-validator';

/**
 * DTO para completar cadastro de aluno
 */
export class CompletarCadastroAlunoDto {
  @IsString({ message: 'Matrícula deve ser uma string' })
  @MinLength(5, { message: 'Matrícula deve ter no mínimo 5 caracteres' })
  @MaxLength(20, { message: 'Matrícula deve ter no máximo 20 caracteres' })
  matricula: string;

  @IsUUID('4', { message: 'UUID do curso inválido' })
  @IsOptional()
  curso_uuid?: string;

  @IsUUID('4', { message: 'UUID da turma inválido' })
  @IsOptional()
  turma_uuid?: string;

  @IsString()
  @Matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  })
  @IsOptional()
  telefone?: string;

  @IsString()
  @MaxLength(500, { message: 'Bio deve ter no máximo 500 caracteres' })
  @IsOptional()
  bio?: string;

  @IsUrl({}, { message: 'LinkedIn URL inválida' })
  @IsOptional()
  linkedin_url?: string;

  @IsUrl({}, { message: 'GitHub URL inválida' })
  @IsOptional()
  github_url?: string;

  @IsUrl({}, { message: 'Portfolio URL inválida' })
  @IsOptional()
  portfolio_url?: string;
}

/**
 * DTO para completar cadastro de professor
 */
export class CompletarCadastroProfessorDto {
  @IsString({ message: 'Matrícula deve ser uma string' })
  @MinLength(5, { message: 'Matrícula deve ter no mínimo 5 caracteres' })
  @MaxLength(20, { message: 'Matrícula deve ter no máximo 20 caracteres' })
  @IsOptional()
  matricula?: string;

  @IsUUID('4', { message: 'UUID do departamento inválido' })
  @IsOptional()
  departamento_uuid?: string;

  @IsString()
  @MaxLength(255, { message: 'Especialidade deve ter no máximo 255 caracteres' })
  @IsOptional()
  especialidade?: string;

  @IsString()
  @Matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  })
  @IsOptional()
  telefone?: string;

  @IsString()
  @MaxLength(500, { message: 'Bio deve ter no máximo 500 caracteres' })
  @IsOptional()
  bio?: string;

  @IsUrl({}, { message: 'LinkedIn URL inválida' })
  @IsOptional()
  linkedin_url?: string;

  @IsUrl({}, { message: 'Lattes URL inválida' })
  @IsOptional()
  lattes_url?: string;
}

/**
 * DTO para atualizar perfil (campos opcionais)
 */
export class AtualizarPerfilDto {
  @IsString()
  @MaxLength(500, { message: 'Bio deve ter no máximo 500 caracteres' })
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  linkedin_url?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  github_url?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  portfolio_url?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  instagram_url?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  tiktok_url?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  facebook_url?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  lattes_url?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  especialidade?: string;

  // Campos de endereço
  @IsString()
  @MaxLength(10)
  @IsOptional()
  cep?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  logradouro?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  numero?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  complemento?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  bairro?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  cidade?: string;

  @IsString()
  @MaxLength(2)
  @IsOptional()
  estado?: string;
}
