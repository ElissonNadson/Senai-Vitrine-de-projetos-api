import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SolicitacoesService } from './solicitacoes.service';

@Controller('projetos/solicitacoes')
export class SolicitacoesController {
  constructor(private readonly solicitacoesService: SolicitacoesService) {}

  @Post(':projetoUuid/desativacao')
  @UseGuards(AuthGuard('jwt'))
  async criarDesativacao(
    @Param('projetoUuid') projetoUuid: string,
    @Body() body: { motivo: string },
    @CurrentUser() usuario: any,
  ) {
    return this.solicitacoesService.criarSolicitacaoDesativacao(
      projetoUuid,
      body.motivo || '',
      usuario,
    );
  }

  @Post(':uuid/aceitar')
  @UseGuards(AuthGuard('jwt'))
  async aceitar(
    @Param('uuid') uuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.solicitacoesService.decidirSolicitacao(uuid, true, usuario);
  }

  @Post(':uuid/rejeitar')
  @UseGuards(AuthGuard('jwt'))
  async rejeitar(
    @Param('uuid') uuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.solicitacoesService.decidirSolicitacao(uuid, false, usuario);
  }
}
