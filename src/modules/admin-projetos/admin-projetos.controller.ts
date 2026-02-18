import { Controller, Get, Patch, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { AdminProjetosService } from './admin-projetos.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin/projetos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AdminProjetosController {
  constructor(private readonly service: AdminProjetosService) {}

  @Get()
  listarTodos(@Query() query: any) {
    return this.service.listarTodos({
      status: query.status,
      fase_atual: query.fase_atual,
      curso: query.curso,
      departamento_uuid: query.departamento_uuid,
      busca: query.busca,
      limit: query.limit ? parseInt(query.limit) : 20,
      offset: query.offset ? parseInt(query.offset) : 0,
      orderBy: query.orderBy ? `p.${query.orderBy}` : undefined,
      orderDir: query.orderDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    });
  }

  @Patch(':uuid/status')
  alterarStatus(
    @Param('uuid') uuid: string,
    @Body('status') status: string,
    @Body('observacao') observacao?: string,
  ) {
    return this.service.alterarStatus(uuid, status, observacao);
  }

  @Patch(':uuid/fase')
  alterarFase(
    @Param('uuid') uuid: string,
    @Body('fase') fase: string,
    @CurrentUser() user: any,
    @Body('observacao') observacao?: string,
  ) {
    return this.service.alterarFase(uuid, fase, user.uuid, observacao);
  }

  @Delete(':uuid/integrante/:usuarioUuid')
  removerIntegrante(
    @Param('uuid') projetoUuid: string,
    @Param('usuarioUuid') usuarioUuid: string,
  ) {
    return this.service.removerIntegrante(projetoUuid, usuarioUuid);
  }

  @Patch(':uuid/integrante/:usuarioUuid')
  alterarPapelIntegrante(
    @Param('uuid') projetoUuid: string,
    @Param('usuarioUuid') usuarioUuid: string,
    @Body('papel') novoPapel: string,
  ) {
    return this.service.alterarPapelIntegrante(projetoUuid, usuarioUuid, novoPapel);
  }

  @Delete(':uuid')
  excluirProjeto(@Param('uuid') uuid: string) {
    return this.service.excluirProjeto(uuid);
  }
}
