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
  IsBoolean,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Passo 1: Informações básicas do projeto
 * Inclui: título, descrição, categoria e banner
 */
export class Passo1ProjetoDto {
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MinLength(10, { message: 'Título deve ter no mínimo 10 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MinLength(50, { message: 'Descrição deve ter no mínimo 50 caracteres' })
  @MaxLength(5000, { message: 'Descrição deve ter no máximo 5000 caracteres' })
  descricao: string;

  @IsString()
  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  @IsIn([
    'Aplicativo / Site',
    'Automação de Processos',
    'Bioprodutos',
    'Chatbots e Automação Digital',
    'Dashboards e Análises de Dados',
    'Economia Circular',
    'Educação',
    'E-commerce e Marketplace',
    'Eficiência Energética',
    'Impressão 3D',
    'Impacto Social',
    'IoT',
    'Manufatura Inteligente',
    'Modelo de Negócio',
    'Sistemas de Gestão (ERP, CRM, etc.)',
    'Sustentabilidade e Meio Ambiente',
    'Tecnologias Assistivas e Acessibilidade',
    'Outro'
  ], { message: 'Categoria inválida' })
  categoria: string;
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
 * Passo 2: Informações Acadêmicas
 * Curso, turma, unidade curricular, modalidade, etc.
 */
export class Passo2ProjetoDto {
  @IsString()
  @IsNotEmpty({ message: 'Curso é obrigatório' })
  @MaxLength(200, { message: 'Nome do curso muito longo' })
  curso: string;

  @IsString()
  @IsNotEmpty({ message: 'Turma é obrigatória' })
  @MaxLength(50, { message: 'Código da turma muito longo' })
  turma: string;

  @IsString()
  @IsNotEmpty({ message: 'Modalidade é obrigatória' })
  @IsIn(['Presencial', 'Semipresencial'], { message: 'Modalidade deve ser Presencial ou Semipresencial' })
  modalidade: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Nome da unidade curricular muito longo' })
  unidade_curricular?: string;

  @IsBoolean()
  @IsOptional()
  itinerario?: boolean;

  @IsBoolean()
  @IsOptional()
  senai_lab?: boolean;

  @IsBoolean()
  @IsOptional()
  saga_senai?: boolean;
}

/**
 * Passo 3: Equipe (autores e orientadores)
 */
export class Passo3ProjetoDto {
  @IsArray({ message: 'Autores deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => AutorProjetoDto)
  @ArrayMinSize(1, { message: 'Projeto deve ter pelo menos 1 autor' })
  @ArrayMaxSize(10, { message: 'Projeto pode ter no máximo 10 autores' })
  autores: AutorProjetoDto[];

  @IsArray({ message: 'Orientadores deve ser um array' })
  @IsUUID('4', { each: true, message: 'UUID de professor inválido' })
  @ArrayMinSize(1, { message: 'Projeto deve ter pelo menos 1 orientador' })
  @ArrayMaxSize(5, { message: 'Projeto pode ter no máximo 5 orientadores' })
  orientadores_uuids: string[];
}

/**
 * DTO para anexo de fase do projeto
 */
export class AnexoFaseDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do anexo é obrigatório' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: 'Tipo do anexo é obrigatório' })
  tipo: string; // crazy8, mapa_mental, wireframe, etc.

  @IsString()
  @IsNotEmpty({ message: 'Nome do arquivo é obrigatório' })
  nome_arquivo: string;

  @IsString()
  @IsNotEmpty({ message: 'URL do arquivo é obrigatória' })
  url_arquivo: string;

  @IsOptional()
  tamanho_bytes?: number;

  @IsString()
  @IsOptional()
  mime_type?: string;
}

/**
 * DTO para fase do projeto (ideação, modelagem, prototipagem, implementação)
 */
export class FaseProjetoDto {
  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'Descrição da fase deve ter no máximo 5000 caracteres' })
  descricao?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnexoFaseDto)
  @IsOptional()
  anexos?: AnexoFaseDto[];
}

/**
 * Passo 4: Fases do Projeto
 * Ideação, Modelagem, Prototipagem e Implementação
 */
export class Passo4ProjetoDto {
  @ValidateNested()
  @Type(() => FaseProjetoDto)
  @IsOptional()
  ideacao?: FaseProjetoDto;

  @ValidateNested()
  @Type(() => FaseProjetoDto)
  @IsOptional()
  modelagem?: FaseProjetoDto;

  @ValidateNested()
  @Type(() => FaseProjetoDto)
  @IsOptional()
  prototipagem?: FaseProjetoDto;

  @ValidateNested()
  @Type(() => FaseProjetoDto)
  @IsOptional()
  implementacao?: FaseProjetoDto;
}

/**
 * Passo 5: Repositório de Código e Privacidade
 */
export class Passo5ProjetoDto {
  @IsBoolean()
  has_repositorio: boolean;

  @IsString()

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.link_repositorio !== "" && o.link_repositorio !== null && o.link_repositorio !== undefined)
  @IsUrl({}, { message: 'Link do repositório inválido' })
  @MaxLength(500, { message: 'Link do repositório muito longo' })
  link_repositorio?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Público', 'Privado'], { message: 'Visibilidade do código deve ser Público ou Privado' })
  codigo_visibilidade?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Público', 'Privado'], { message: 'Visibilidade dos anexos deve ser Público ou Privado' })
  anexos_visibilidade?: string;

  @IsBoolean()
  @IsNotEmpty({ message: 'É necessário aceitar os termos' })
  aceitou_termos: boolean;

  // Arquivo ZIP do código será enviado via multipart/form-data separadamente
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
  @MinLength(50)
  @IsString()
  @IsOptional()
  @MinLength(50)
  @MaxLength(5000)
  descricao?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  repositorio_url?: string;

  @IsBoolean()
  @IsOptional()
  itinerario?: boolean;

  @IsBoolean()
  @IsOptional()
  lab_maker?: boolean;

  @IsBoolean()
  @IsOptional()
  participou_saga?: boolean;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsString()
  @IsOptional()
  banner_url?: string;
}
