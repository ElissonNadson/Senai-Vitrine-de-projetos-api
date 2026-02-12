import { promises as fs } from 'fs';
import { extname, join } from 'path';
// usamos import dinâmica para suportar múltiplas versões do pacote 'file-type'
import { BadRequestException } from '@nestjs/common';

/**
 * Tipos de arquivo permitidos e suas configurações
 */
export interface TipoArquivoConfig {
  extensoesPermitidas: string[];
  mimeTypesPermitidos: string[];
  magicNumbers: string[]; // Primeiros bytes do arquivo (hex)
  tamanhoMaximoMB: number;
  descricao: string;
}

/**
 * Configurações de tipos de arquivo por categoria
 */
export const TIPOS_ARQUIVO: Record<string, TipoArquivoConfig> = {
  BANNER: {
    extensoesPermitidas: ['.jpg', '.jpeg', '.png', '.webp'],
    mimeTypesPermitidos: ['image/jpeg', 'image/png', 'image/webp'],
    magicNumbers: [
      'ffd8ff', // JPEG
      '89504e47', // PNG
      '52494646', // WebP (RIFF)
    ],
    tamanhoMaximoMB: 5,
    descricao: 'Banner do projeto',
  },
  AVATAR: {
    extensoesPermitidas: ['.jpg', '.jpeg', '.png', '.webp'],
    mimeTypesPermitidos: ['image/jpeg', 'image/png', 'image/webp'],
    magicNumbers: ['ffd8ff', '89504e47', '52494646'],
    tamanhoMaximoMB: 2,
    descricao: 'Foto de perfil',
  },
  ANEXO_DOCUMENTO: {
    extensoesPermitidas: ['.pdf', '.doc', '.docx', '.txt'],
    mimeTypesPermitidos: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    magicNumbers: [
      '25504446', // PDF
      'd0cf11e0', // DOC
      '504b0304', // DOCX (ZIP)
    ],
    tamanhoMaximoMB: 10,
    descricao: 'Documento anexo',
  },
  ANEXO_IMAGEM: {
    extensoesPermitidas: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    mimeTypesPermitidos: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    magicNumbers: [
      'ffd8ff', // JPEG
      '89504e47', // PNG
      '52494646', // WebP
      '47494638', // GIF
    ],
    tamanhoMaximoMB: 5,
    descricao: 'Imagem anexa',
  },
  ANEXO_VIDEO: {
    extensoesPermitidas: ['.mp4', '.webm', '.avi', '.mov'],
    mimeTypesPermitidos: ['video/mp4', 'video/webm', 'video/x-msvideo', 'video/quicktime'],
    magicNumbers: [
      '00000018', // MP4 (ftyp)
      '00000020', // MP4 (ftyp variante)
      '1a45dfa3', // WebM
    ],
    tamanhoMaximoMB: 50,
    descricao: 'Vídeo anexo',
  },
  ANEXO_GERAL: {
    extensoesPermitidas: [
      // Documentos
      '.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls', '.pptx', '.ppt',
      // Imagens
      '.jpg', '.jpeg', '.png', '.webp', '.gif',
      // Vídeos
      '.mp4', '.webm', '.avi', '.mov',
      // Áudio
      '.mp3',
      // Arquivos compactados
      '.zip', '.rar', '.7z', '.tar', '.gz',
      // Arquivos especializados
      '.fig', '.stl', '.obj',
    ],
    mimeTypesPermitidos: [
      // Documentos
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Imagens
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      // Vídeos
      'video/mp4', 'video/webm', 'video/x-msvideo', 'video/quicktime',
      // Áudio
      'audio/mpeg', 'audio/mp3',
      // Compactados
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      'application/x-tar', 'application/gzip',
      // Especializados
      'application/octet-stream', // .fig, .stl, .obj geralmente mapeiam para isso
      'model/stl', 'model/obj',
    ],
    magicNumbers: [
      '25504446', // PDF
      'd0cf11e0', // DOC/XLS/PPT (OLE2)
      '504b0304', // DOCX/XLSX/PPTX/ZIP (ZIP-based)
      'ffd8ff',   // JPEG
      '89504e47', // PNG
      '52494646', // WebP/AVI (RIFF)
      '47494638', // GIF
      '00000018', // MP4
      '00000020', // MP4 variante
      '1a45dfa3', // WebM
      '494433',   // MP3 (ID3)
      'fffb',     // MP3 (sem ID3)
      '526172',   // RAR
      '377abcaf', // 7z
      '1f8b',     // GZIP/TAR.GZ
    ],
    tamanhoMaximoMB: 50,
    descricao: 'Anexo de projeto (documento, imagem, vídeo, áudio ou arquivo)',
  },
};

/**
 * Valida magic numbers do arquivo para prevenir upload de executáveis renomeados
 * 
 * @param buffer - Buffer do arquivo
 * @param tipoEsperado - Tipo de arquivo esperado
 * @returns true se os magic numbers são válidos
 * 
 * @example
 * await validarMagicNumbers(fileBuffer, 'BANNER')
 * // Retorna: true se for imagem válida
 */
export async function validarMagicNumbers(
  buffer: Buffer,
  tipoEsperado: keyof typeof TIPOS_ARQUIVO,
): Promise<boolean> {
  try {
    // Usa biblioteca file-type para detectar tipo real do arquivo
    // Faz import dinâmica para compatibilidade com versões que exportam
    // `fileTypeFromBuffer` ou `fromBuffer`.
    const fileTypeLib: any = await import('file-type');
    const detectFn: ((b: Buffer) => Promise<any>) |
      undefined = fileTypeLib.fileTypeFromBuffer || fileTypeLib.fromBuffer || fileTypeLib.default?.fromBuffer;

    if (!detectFn) {
      throw new BadRequestException('Biblioteca file-type não disponível no runtime');
    }

    const tipoDetectado = await detectFn(buffer);
    const config = TIPOS_ARQUIVO[tipoEsperado];

    // Para ANEXO_GERAL, formatos como .txt, .fig, .stl, .obj não são
    // reconhecidos pelo file-type — permitir se a extensão já foi validada
    if (!tipoDetectado) {
      if (tipoEsperado === 'ANEXO_GERAL') {
        return true; // Extensão já foi validada em validarExtensao()
      }
      throw new BadRequestException(
        'Não foi possível detectar o tipo do arquivo',
      );
    }

    // Verifica se o MIME type detectado está na lista de permitidos
    if (!config.mimeTypesPermitidos.includes(tipoDetectado.mime)) {
      throw new BadRequestException(
        `Arquivo inválido. Tipo detectado: ${tipoDetectado.mime}. ` +
        `Tipos permitidos: ${config.mimeTypesPermitidos.join(', ')}`,
      );
    }

    // Para ANEXO_GERAL, pular verificação de magic numbers (muitos formatos)
    if (tipoEsperado === 'ANEXO_GERAL') {
      return true;
    }

    // Verifica os primeiros bytes (magic numbers)
    const primeirosBytes = buffer.slice(0, 4).toString('hex');
    const magicNumberValido = config.magicNumbers.some((magic) =>
      primeirosBytes.startsWith(magic),
    );

    if (!magicNumberValido) {
      throw new BadRequestException(
        'Arquivo suspeito detectado. Magic numbers não correspondem ao tipo declarado.',
      );
    }

    return true;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(
      'Erro ao validar arquivo: ' + error.message,
    );
  }
}

/**
 * Valida extensão do arquivo
 * 
 * @param nomeArquivo - Nome do arquivo
 * @param tipoEsperado - Tipo de arquivo esperado
 * @returns true se a extensão é válida
 */
export function validarExtensao(
  nomeArquivo: string,
  tipoEsperado: keyof typeof TIPOS_ARQUIVO,
): boolean {
  const config = TIPOS_ARQUIVO[tipoEsperado];
  const extensao = extname(nomeArquivo).toLowerCase();

  if (!config.extensoesPermitidas.includes(extensao)) {
    throw new BadRequestException(
      `Extensão inválida. Extensões permitidas: ${config.extensoesPermitidas.join(', ')}`,
    );
  }

  return true;
}

/**
 * Valida tamanho do arquivo
 * 
 * @param tamanhoBytes - Tamanho do arquivo em bytes
 * @param tipoEsperado - Tipo de arquivo esperado
 * @returns true se o tamanho é válido
 */
export function validarTamanho(
  tamanhoBytes: number,
  tipoEsperado: keyof typeof TIPOS_ARQUIVO,
): boolean {
  const config = TIPOS_ARQUIVO[tipoEsperado];
  const tamanhoMaximoBytes = config.tamanhoMaximoMB * 1024 * 1024;

  if (tamanhoBytes > tamanhoMaximoBytes) {
    throw new BadRequestException(
      `Arquivo muito grande. Tamanho máximo: ${config.tamanhoMaximoMB}MB`,
    );
  }

  if (tamanhoBytes === 0) {
    throw new BadRequestException('Arquivo vazio');
  }

  return true;
}

/**
 * Valida arquivo completo (extensão, tamanho e magic numbers)
 * 
 * @param arquivo - Arquivo do Multer
 * @param tipoEsperado - Tipo de arquivo esperado
 * @returns true se o arquivo é válido
 * 
 * @example
 * await validarArquivoCompleto(file, 'BANNER')
 * // Lança exceção se arquivo inválido, retorna true se válido
 */
export async function validarArquivoCompleto(
  arquivo: Express.Multer.File,
  tipoEsperado: keyof typeof TIPOS_ARQUIVO,
): Promise<boolean> {
  // Validar extensão
  validarExtensao(arquivo.originalname, tipoEsperado);

  // Validar tamanho
  validarTamanho(arquivo.size, tipoEsperado);

  // Validar magic numbers (previne executáveis renomeados)
  await validarMagicNumbers(arquivo.buffer, tipoEsperado);

  return true;
}

/**
 * Gera nome único para arquivo usando timestamp + UUID
 * 
 * @param nomeOriginal - Nome original do arquivo
 * @returns Nome único gerado
 * 
 * @example
 * gerarNomeUnico('foto.jpg')
 * // Retorna: "1700245789123-a1b2c3d4.jpg"
 */
export function gerarNomeUnico(nomeOriginal: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const extensao = extname(nomeOriginal);

  return `${timestamp}-${random}${extensao}`;
}

/**
 * Salva arquivo no sistema de arquivos local
 * 
 * @param arquivo - Arquivo do Multer
 * @param pasta - Pasta de destino (banners, anexos, avatars)
 * @returns Caminho do arquivo salvo
 * 
 * @example
 * const caminho = await salvarArquivoLocal(file, 'banners')
 * // Retorna: "/uploads/banners/1700245789123-a1b2c3d4.jpg"
 */
export async function salvarArquivoLocal(
  arquivo: Express.Multer.File,
  pasta: string,
): Promise<string> {
  try {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const pastaCompleta = join(uploadPath, pasta);

    // Garantir que a pasta existe
    await fs.mkdir(pastaCompleta, { recursive: true });

    // Gerar nome único
    const nomeUnico = gerarNomeUnico(arquivo.originalname);
    const caminhoCompleto = join(pastaCompleta, nomeUnico);

    // Salvar arquivo
    await fs.writeFile(caminhoCompleto, arquivo.buffer);

    // Retornar caminho relativo
    return `/api/uploads/${pasta}/${nomeUnico}`;
  } catch (error) {
    throw new BadRequestException(
      'Erro ao salvar arquivo: ' + error.message,
    );
  }
}

/**
 * Deleta arquivo do sistema de arquivos
 * 
 * @param caminhoRelativo - Caminho relativo do arquivo
 * @returns true se deletado com sucesso
 * 
 * @example
 * await deletarArquivo('/banners/1700245789123-a1b2c3d4.jpg')
 */
export async function deletarArquivo(
  caminhoRelativo: string,
): Promise<boolean> {
  try {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const caminhoCompleto = join(uploadPath, caminhoRelativo);

    await fs.unlink(caminhoCompleto);
    return true;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
}

/**
 * Converte bytes para formato legível
 * 
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "1.5 MB")
 * 
 * @example
 * formatarTamanhoArquivo(1572864)
 * // Retorna: "1.5 MB"
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const tamanhos = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
}
