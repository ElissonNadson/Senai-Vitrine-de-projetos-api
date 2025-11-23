import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './upload.service';
import { UploadRateLimitGuard } from '../../common/guards/rate-limit.guard';

@Controller('upload')
@UseGuards(UploadRateLimitGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /upload/banner
   * Upload de banner de projeto
   */
  @Post('banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadBanner(file);
  }

  /**
   * POST /upload/avatar
   * Upload de avatar de usuário
   */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadAvatar(file);
  }

  /**
   * POST /upload/anexo
   * Upload de anexo de etapa
   * Query param: tipo=DOCUMENTO|IMAGEM|VIDEO
   */
  @Post('anexo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAnexo(
    @UploadedFile() file: Express.Multer.File,
    @Query('tipo') tipo: 'DOCUMENTO' | 'IMAGEM' | 'VIDEO',
  ) {
    return this.uploadService.uploadAnexo(file, tipo);
  }

  /**
   * GET /upload/tipos
   * Retorna informações sobre tipos de arquivo suportados
   */
  @Get('tipos')
  getTiposSuportados() {
    return this.uploadService.getTiposSuportados();
  }
}
