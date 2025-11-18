import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProgressaoService } from './progressao.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('progressao')
@UseGuards(AuthGuard('jwt'))
export class ProgressaoController {
  constructor(private readonly progressaoService: ProgressaoService) {}

  /**
   * GET /progressao/verificar/:projetoUuid
   * Verifica se projeto pode progredir
   */
  @Get('verificar/:projetoUuid')
  async verificarProgressao(@Param('projetoUuid') projetoUuid: string) {
    return this.progressaoService.verificarProgressao(projetoUuid);
  }

  /**
   * POST /progressao/forcar/:projetoUuid
   * Força progressão manual (admin/orientador)
   */
  @Post('forcar/:projetoUuid')
  async forcarProgressao(
    @Param('projetoUuid') projetoUuid: string,
    @Body('novaFase') novaFase: string,
    @CurrentUser() usuario: any,
  ) {
    return this.progressaoService.forcarProgressao(projetoUuid, novaFase, usuario);
  }

  /**
   * POST /progressao/automatica/:projetoUuid
   * Executa progressão automática
   */
  @Post('automatica/:projetoUuid')
  async executarProgressaoAutomatica(@Param('projetoUuid') projetoUuid: string) {
    return this.progressaoService.executarProgressaoAutomatica(projetoUuid);
  }

  /**
   * GET /progressao/historico/:projetoUuid
   * Busca histórico de progressões
   */
  @Get('historico/:projetoUuid')
  async buscarHistorico(@Param('projetoUuid') projetoUuid: string) {
    return this.progressaoService.buscarHistorico(projetoUuid);
  }

  /**
   * POST /progressao/transferir-lideranca/:projetoUuid
   * Transfere liderança do projeto
   */
  @Post('transferir-lideranca/:projetoUuid')
  async transferirLideranca(
    @Param('projetoUuid') projetoUuid: string,
    @Body('novoLiderAlunoUuid') novoLiderAlunoUuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.progressaoService.transferirLideranca(
      projetoUuid,
      novoLiderAlunoUuid,
      usuario,
    );
  }
}
