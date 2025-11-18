import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificacoesService } from './notificacoes.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notificacoes')
@UseGuards(AuthGuard('jwt'))
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  /**
   * GET /notificacoes
   * Lista notificações do usuário
   */
  @Get()
  async listarNotificacoes(
    @CurrentUser() usuario: any,
    @Query('apenasNaoLidas') apenasNaoLidas?: string,
  ) {
    return this.notificacoesService.listarNotificacoes(
      usuario,
      apenasNaoLidas === 'true',
    );
  }

  /**
   * GET /notificacoes/nao-lidas/contar
   * Conta notificações não lidas
   */
  @Get('nao-lidas/contar')
  async contarNaoLidas(@CurrentUser() usuario: any) {
    return this.notificacoesService.contarNaoLidas(usuario);
  }

  /**
   * POST /notificacoes/:uuid/marcar-lida
   * Marca notificação como lida
   */
  @Post(':uuid/marcar-lida')
  async marcarComoLida(
    @Param('uuid') uuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.notificacoesService.marcarComoLida(uuid, usuario);
  }

  /**
   * POST /notificacoes/marcar-todas-lidas
   * Marca todas as notificações como lidas
   */
  @Post('marcar-todas-lidas')
  async marcarTodasComoLidas(@CurrentUser() usuario: any) {
    return this.notificacoesService.marcarTodasComoLidas(usuario);
  }

  /**
   * DELETE /notificacoes/:uuid
   * Deleta notificação
   */
  @Delete(':uuid')
  async deletarNotificacao(
    @Param('uuid') uuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.notificacoesService.deletarNotificacao(uuid, usuario);
  }
}
