import { IsNotEmpty, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

/**
 * DTO para aluno solicitar arquivamento de projeto
 */
export class SolicitarArquivamentoDto {
  @IsNotEmpty({ message: 'O UUID do projeto é obrigatório' })
  @IsUUID('4', { message: 'UUID do projeto inválido' })
  projeto_uuid: string;

  @IsNotEmpty({ message: 'A justificativa é obrigatória' })
  @IsString({ message: 'A justificativa deve ser um texto' })
  @MinLength(20, { message: 'A justificativa deve ter no mínimo 20 caracteres' })
  @MaxLength(1000, { message: 'A justificativa deve ter no máximo 1000 caracteres' })
  justificativa: string;
}

/**
 * DTO para orientador aprovar arquivamento
 */
export class AprovarArquivamentoDto {
  @IsNotEmpty({ message: 'O UUID da solicitação é obrigatório' })
  @IsUUID('4', { message: 'UUID da solicitação inválido' })
  solicitacao_uuid: string;
}

/**
 * DTO para orientador negar arquivamento
 */
export class NegarArquivamentoDto {
  @IsNotEmpty({ message: 'O UUID da solicitação é obrigatório' })
  @IsUUID('4', { message: 'UUID da solicitação inválido' })
  solicitacao_uuid: string;

  @IsNotEmpty({ message: 'A justificativa da negação é obrigatória' })
  @IsString({ message: 'A justificativa da negação deve ser um texto' })
  @MinLength(20, { message: 'A justificativa da negação deve ter no mínimo 20 caracteres' })
  @MaxLength(1000, { message: 'A justificativa da negação deve ter no máximo 1000 caracteres' })
  justificativa_negacao: string;
}
