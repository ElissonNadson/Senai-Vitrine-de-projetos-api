import { IsString, IsOptional, IsBoolean, IsDateString, IsUUID, IsEnum } from 'class-validator';

export class CreateNoticiaDto {
  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  resumo?: string;

  @IsString()
  @IsOptional()
  conteudo?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsDateString()
  @IsOptional()
  dataEvento?: string;

  @IsString()
  @IsOptional()
  localEvento?: string;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsBoolean()
  @IsOptional()
  publicado?: boolean;

  @IsBoolean()
  @IsOptional()
  destaque?: boolean;
}

export class UpdateNoticiaDto extends CreateNoticiaDto {}
