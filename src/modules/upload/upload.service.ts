import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  validarArquivoCompleto,
  salvarArquivoLocal,
  deletarArquivo,
  TIPOS_ARQUIVO,
} from '../../common/utils/file-upload.util';
import * as path from 'path';

@Injectable()
export class UploadService {
  /**
   * Valida e salva arquivo de banner
   */
  async uploadBanner(
    file: Express.Multer.File,
    context?: string,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Validar arquivo completo
    await validarArquivoCompleto(file, 'BANNER');

    try {
      let folder = 'banners'; // Default
      if (context === 'news_banner') {
        folder = 'noticias/banner';
      } else if (context === 'news_content') {
        folder = 'noticias/corpo';
      } else if (context === 'project_banner') {
        folder = 'projetos/banner';
      }

      // Salvar arquivo localmente
      const caminhoRelativo = await salvarArquivoLocal(file, folder);

      return {
        url: caminhoRelativo,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao salvar arquivo: ' + error.message,
      );
    }
  }

  /**
   * Valida e salva arquivo de avatar
   */
  async uploadAvatar(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Validar arquivo completo
    await validarArquivoCompleto(file, 'AVATAR');

    try {
      // Salvar arquivo localmente
      const caminhoRelativo = await salvarArquivoLocal(
        file,
        'avatars',
      );

      return {
        url: caminhoRelativo,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao salvar arquivo: ' + error.message,
      );
    }
  }

  /**
   * Valida e salva anexo de etapa (documento, imagem ou vídeo)
   */
  async uploadAnexo(
    file: Express.Multer.File,
    tipo: 'DOCUMENTO' | 'IMAGEM' | 'VIDEO',
  ): Promise<{ url: string; tipo: string; tamanho: number }> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const tipoValidacao =
      tipo === 'DOCUMENTO'
        ? 'ANEXO_DOCUMENTO'
        : tipo === 'IMAGEM'
          ? 'ANEXO_IMAGEM'
          : 'ANEXO_VIDEO';

    // Validar arquivo completo
    await validarArquivoCompleto(file, tipoValidacao);

    try {
      // Salvar arquivo localmente
      const caminhoRelativo = await salvarArquivoLocal(
        file,
        'anexos',
      );

      const extensao = file.originalname.split('.').pop();

      return {
        url: caminhoRelativo,
        tipo: extensao?.toUpperCase() || 'DESCONHECIDO',
        tamanho: file.size,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao salvar arquivo: ' + error.message,
      );
    }
  }

  /**
   * Deleta arquivo do sistema
   */
  async deletarArquivo(caminhoRelativo: string): Promise<void> {
    try {
      await deletarArquivo(caminhoRelativo);
    } catch (error) {
      // Não lança erro se arquivo não existir
      console.warn('Erro ao deletar arquivo:', error.message);
    }
  }

  /**
   * Obtém informações sobre tipos de arquivo suportados
   */
  getTiposSuportados(): any {
    return {
      banner: {
        tamanho_maximo: TIPOS_ARQUIVO.BANNER.tamanhoMaximoMB,
        extensoes: TIPOS_ARQUIVO.BANNER.extensoesPermitidas,
      },
      avatar: {
        tamanho_maximo: TIPOS_ARQUIVO.AVATAR.tamanhoMaximoMB,
        extensoes: TIPOS_ARQUIVO.AVATAR.extensoesPermitidas,
      },
      documento: {
        tamanho_maximo: TIPOS_ARQUIVO.ANEXO_DOCUMENTO.tamanhoMaximoMB,
        extensoes: TIPOS_ARQUIVO.ANEXO_DOCUMENTO.extensoesPermitidas,
      },
      imagem: {
        tamanho_maximo: TIPOS_ARQUIVO.ANEXO_IMAGEM.tamanhoMaximoMB,
        extensoes: TIPOS_ARQUIVO.ANEXO_IMAGEM.extensoesPermitidas,
      },
      video: {
        tamanho_maximo: TIPOS_ARQUIVO.ANEXO_VIDEO.tamanhoMaximoMB,
        extensoes: TIPOS_ARQUIVO.ANEXO_VIDEO.extensoesPermitidas,
      },
    };
  }
}
