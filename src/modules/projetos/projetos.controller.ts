import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjetosService } from './projetos.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  Passo1ProjetoDto,
  Passo2ProjetoDto,
  Passo3ProjetoDto,
  Passo4ProjetoDto,
  UpdateProjetoDto,
} from './dto/create-projeto.dto';

@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) {}

  /**
   * POST /projetos/passo1
   * Cria rascunho do projeto (Passo 1)
   */
  @Post('passo1')
  @UseGuards(AuthGuard('jwt'))
  async criarPasso1(
    @Body() dados: Passo1ProjetoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.criarPasso1(dados, usuario);
  }

  /**
   * POST /projetos/:uuid/passo2
   * Adiciona autores ao projeto (Passo 2)
   */
  @Post(':uuid/passo2')
  @UseGuards(AuthGuard('jwt'))
  async adicionarAutoresPasso2(
    @Param('uuid') uuid: string,
    @Body() dados: Passo2ProjetoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.adicionarAutoresPasso2(uuid, dados, usuario);
  }

  /**
   * POST /projetos/:uuid/passo3
   * Adiciona orientadores e tecnologias (Passo 3)
   */
  @Post(':uuid/passo3')
  @UseGuards(AuthGuard('jwt'))
  async adicionarOrientadoresPasso3(
    @Param('uuid') uuid: string,
    @Body() dados: Passo3ProjetoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.adicionarOrientadoresPasso3(uuid, dados, usuario);
  }

  /**
   * POST /projetos/:uuid/passo4
   * Publica projeto com banner (Passo 4)
   */
  @Post(':uuid/passo4')
  @UseGuards(AuthGuard('jwt'))
  async publicarProjetoPasso4(
    @Param('uuid') uuid: string,
    @Body() dados: Passo4ProjetoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.publicarProjetoPasso4(uuid, dados, usuario);
  }

  /**
   * GET /projetos
   * Lista projetos publicados com filtros
   */
  @Get()
  async listarProjetos(
    @Query('departamento_uuid') departamento_uuid?: string,
    @Query('fase') fase?: string,
    @Query('tecnologia_uuid') tecnologia_uuid?: string,
    @Query('busca') busca?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.projetosService.listarProjetos({
      departamento_uuid,
      fase,
      tecnologia_uuid,
      busca,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * GET /projetos/meus
   * Lista projetos do usuário logado (publicados e rascunhos)
   */
  @Get('meus')
  async listarMeusProjetos(@CurrentUser() usuario: any) {
    return this.projetosService.listarMeusProjetos(usuario);
  }

  /**
   * GET /projetos/:uuid
   * Busca projeto por UUID
   */
  @Get(':uuid')
  async buscarProjeto(@Param('uuid') uuid: string, @CurrentUser() usuario?: any) {
    return this.projetosService.buscarProjeto(uuid, usuario);
  }

  /**
   * PATCH /projetos/:uuid
   * Atualiza projeto existente
   */
  @Patch(':uuid')
  @UseGuards(AuthGuard('jwt'))
  async atualizarProjeto(
    @Param('uuid') uuid: string,
    @Body() dados: UpdateProjetoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.atualizarProjeto(uuid, dados, usuario);
  }

  /**
   * DELETE /projetos/:uuid
   * Deleta projeto (soft delete - arquiva)
   */
  @Delete(':uuid')
  @UseGuards(AuthGuard('jwt'))
  async deletarProjeto(@Param('uuid') uuid: string, @CurrentUser() usuario: any) {
    return this.projetosService.deletarProjeto(uuid, usuario);
  }
}
