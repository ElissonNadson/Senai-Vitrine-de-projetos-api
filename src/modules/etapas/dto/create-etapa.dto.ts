import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsIn,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para criar nova etapa do projeto
 */
export class CreateEtapaDto {
  @IsString()
  @IsNotEmpty({ message: 'Título da etapa é obrigatório' })
  @MinLength(5, { message: 'Título deve ter no mínimo 5 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MinLength(20, { message: 'Descrição deve ter no mínimo 20 caracteres' })
  @MaxLength(2000, { message: 'Descrição deve ter no máximo 2000 caracteres' })
  descricao: string;

  @IsIn(['PLANEJAMENTO', 'DESENVOLVIMENTO', 'TESTE', 'DOCUMENTACAO', 'APRESENTACAO'], {
    message: 'Tipo de etapa inválido',
  })
  tipo_etapa: string;
}

/**
 * DTO para anexo de etapa
 */
export class AnexoEtapaDto {
  @IsString()
  @IsNotEmpty({ message: 'URL do anexo é obrigatória' })
  url: string;

  @IsIn(['DOCUMENTO', 'IMAGEM', 'VIDEO'], { message: 'Tipo de anexo inválido' })
  tipo: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  descricao?: string;
}

/**
 * DTO para adicionar anexos à etapa
 */
export class AdicionarAnexosDto {
  @IsArray({ message: 'Anexos deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => AnexoEtapaDto)
  anexos: AnexoEtapaDto[];
}

/**
 * DTO para atualizar etapa
 */
export class UpdateEtapaDto {
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(200)
  titulo?: string;

  @IsString()
  @IsOptional()
  @MinLength(20)
  @MaxLength(2000)
  descricao?: string;

  @IsIn(['PLANEJAMENTO', 'DESENVOLVIMENTO', 'TESTE', 'DOCUMENTACAO', 'APRESENTACAO'])
  @IsOptional()
  tipo_etapa?: string;
}

/**
 * DTO para feedback do orientador
 */
export class FeedbackOrientadorDto {
  @IsIn(['APROVADO', 'REVISAR', 'REJEITADO'], {
    message: 'Status de feedback inválido',
  })
  status: string;

  @IsString()
  @IsNotEmpty({ message: 'Comentário é obrigatório' })
  @MinLength(10, { message: 'Comentário deve ter no mínimo 10 caracteres' })
  @MaxLength(1000, { message: 'Comentário deve ter no máximo 1000 caracteres' })
  comentario: string;
}

/**
 * DTO para concluir etapa
 */
export class ConcluirEtapaDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  observacoes?: string;
}
