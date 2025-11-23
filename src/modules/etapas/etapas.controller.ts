import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EtapasService } from './etapas.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateEtapaDto,
  AdicionarAnexosDto,
  UpdateEtapaDto,
  FeedbackOrientadorDto,
  ConcluirEtapaDto,
} from './dto/create-etapa.dto';

@Controller('etapas')
// @UseGuards(AuthGuard('jwt'))
export class EtapasController {
  constructor(private readonly etapasService: EtapasService) {}

  /**
   * POST /etapas/projeto/:projetoUuid
   * Cria nova etapa para o projeto
   */
  @Post('projeto/:projetoUuid')
  async criarEtapa(
    @Param('projetoUuid') projetoUuid: string,
    @Body() dados: CreateEtapaDto,
    @CurrentUser() usuario: any,
  ) {
    return this.etapasService.criarEtapa(projetoUuid, dados, usuario);
  }

  /**
   * GET /etapas/projeto/:projetoUuid
   * Lista etapas do projeto
   */
  @Get('projeto/:projetoUuid')
  async listarEtapas(@Param('projetoUuid') projetoUuid: string) {
    return this.etapasService.listarEtapas(projetoUuid);
  }

  /**
   * GET /etapas/:uuid
   * Busca etapa por UUID com anexos
   */
  @Get(':uuid')
  async buscarEtapa(@Param('uuid') uuid: string) {
    return this.etapasService.buscarEtapa(uuid);
  }

  /**
   * POST /etapas/:uuid/anexos
   * Adiciona anexos à etapa
   */
  @Post(':uuid/anexos')
  async adicionarAnexos(
    @Param('uuid') uuid: string,
    @Body() dados: AdicionarAnexosDto,
    @CurrentUser() usuario: any,
  ) {
    return this.etapasService.adicionarAnexos(uuid, dados, usuario);
  }

  /**
   * PATCH /etapas/:uuid
   * Atualiza etapa
   */
  @Patch(':uuid')
  async atualizarEtapa(
    @Param('uuid') uuid: string,
    @Body() dados: UpdateEtapaDto,
    @CurrentUser() usuario: any,
  ) {
    return this.etapasService.atualizarEtapa(uuid, dados, usuario);
  }

  /**
   * POST /etapas/:uuid/feedback
   * Orientador fornece feedback sobre etapa
   */
  @Post(':uuid/feedback')
  async fornecerFeedback(
    @Param('uuid') uuid: string,
    @Body() dados: FeedbackOrientadorDto,
    @CurrentUser() usuario: any,
  ) {
    return this.etapasService.fornecerFeedback(uuid, dados, usuario);
  }

  /**
   * POST /etapas/:uuid/concluir
   * Marca etapa como concluída (aguarda feedback)
   */
  @Post(':uuid/concluir')
  async concluirEtapa(
    @Param('uuid') uuid: string,
    @Body() dados: ConcluirEtapaDto,
    @CurrentUser() usuario: any,
  ) {
    return this.etapasService.concluirEtapa(uuid, dados, usuario);
  }

  /**
   * DELETE /etapas/:uuid
   * Deleta etapa
   */
  @Delete(':uuid')
  async deletarEtapa(@Param('uuid') uuid: string, @CurrentUser() usuario: any) {
    return this.etapasService.deletarEtapa(uuid, usuario);
  }

  /**
   * DELETE /etapas/anexo/:anexoUuid
   * Deleta anexo específico
   */
  @Delete('anexo/:anexoUuid')
  async deletarAnexo(
    @Param('anexoUuid') anexoUuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.etapasService.deletarAnexo(anexoUuid, usuario);
  }
}
