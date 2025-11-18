import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO para marcar notificação como lida
 */
export class MarcarLidaDto {
  @IsUUID('4')
  @IsNotEmpty()
  notificacao_uuid: string;
}
