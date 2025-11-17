import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Passo 1: Informações básicas do projeto
 */
export class Passo1ProjetoDto {
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MinLength(10, { message: 'Título deve ter no mínimo 10 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MinLength(100, { message: 'Descrição deve ter no mínimo 100 caracteres' })
  @MaxLength(5000, { message: 'Descrição deve ter no máximo 5000 caracteres' })
  descricao: string;

  @IsUUID('4', { message: 'UUID do departamento inválido' })
  @IsNotEmpty({ message: 'Departamento é obrigatório' })
  departamento_uuid: string;
}

/**
 * DTO para autor do projeto
 */
export class AutorProjetoDto {
  @IsUUID('4', { message: 'UUID do aluno inválido' })
  aluno_uuid: string;

  @IsIn(['LIDER', 'AUTOR'], { message: 'Papel deve ser LIDER ou AUTOR' })
  papel: 'LIDER' | 'AUTOR';
}

/**
 * Passo 2: Definição de autores
 */
export class Passo2ProjetoDto {
  @IsArray({ message: 'Autores deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => AutorProjetoDto)
  @ArrayMinSize(1, { message: 'Projeto deve ter pelo menos 1 autor' })
  @ArrayMaxSize(10, { message: 'Projeto pode ter no máximo 10 autores' })
  autores: AutorProjetoDto[];
}

/**
 * Passo 3: Orientadores e tecnologias
 */
export class Passo3ProjetoDto {
  @IsArray({ message: 'Orientadores deve ser um array' })
  @IsUUID('4', { each: true, message: 'UUID de professor inválido' })
  @ArrayMinSize(1, { message: 'Projeto deve ter pelo menos 1 orientador' })
  @ArrayMaxSize(3, { message: 'Projeto pode ter no máximo 3 orientadores' })
  orientadores_uuids: string[];

  @IsArray({ message: 'Tecnologias deve ser um array' })
  @IsUUID('4', { each: true, message: 'UUID de tecnologia inválido' })
  @ArrayMinSize(1, { message: 'Selecione pelo menos 1 tecnologia' })
  @ArrayMaxSize(10, { message: 'Máximo de 10 tecnologias permitidas' })
  tecnologias_uuids: string[];

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Objetivos devem ter no máximo 500 caracteres' })
  objetivos?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Resultados esperados devem ter no máximo 500 caracteres' })
  resultados_esperados?: string;
}

/**
 * Passo 4: Banner e publicação (o upload será feito separadamente via multipart/form-data)
 */
export class Passo4ProjetoDto {
  @IsString()
  @IsNotEmpty({ message: 'Caminho do banner é obrigatório' })
  banner_url: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'URL do repositório deve ter no máximo 200 caracteres' })
  repositorio_url?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'URL demo deve ter no máximo 200 caracteres' })
  demo_url?: string;
}

/**
 * DTO para atualização de projeto existente
 */
export class UpdateProjetoDto {
  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(200)
  titulo?: string;

  @IsString()
  @IsOptional()
  @MinLength(100)
  @MaxLength(5000)
  descricao?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  objetivos?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  resultados_esperados?: string;

  @IsUUID('4')
  @IsOptional()
  departamento_uuid?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  repositorio_url?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  demo_url?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tecnologias_uuids?: string[];
}
