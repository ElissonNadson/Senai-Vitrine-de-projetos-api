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
  Passo5ProjetoDto,
  UpdateProjetoDto,
} from './dto/create-projeto.dto';

@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) { }

  /**
   * POST /projetos/passo1
   * Cria rascunho do projeto com informações básicas (Passo 1)
   * Campos: titulo, descricao, categoria
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
   * Atualiza informações acadêmicas (Passo 2)
   * Campos: curso, turma, modalidade, unidade_curricular, itinerario, senai_lab, saga_senai
   */
  @Post(':uuid/passo2')
  @UseGuards(AuthGuard('jwt'))
  async atualizarInformacoesAcademicas(
    @Param('uuid') uuid: string,
    @Body() dados: Passo2ProjetoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.atualizarInformacoesAcademicas(uuid, dados, usuario);
  }

  /**
   * POST /projetos/:uuid/passo3
   * Adiciona autores e orientadores (Passo 3)
   * Campos: autores[], orientadores_uuids[]
   */
  @Post(':uuid/passo3')
  @UseGuards(AuthGuard('jwt'))
  async adicionarEquipePasso3(
    @Param('uuid') uuid: string,
    @Body() dados: Passo3ProjetoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.adicionarEquipePasso3(uuid, dados, usuario);
  }

  /**
   * POST /projetos/:uuid/passo4
   * Salva fases do projeto com descrições e anexos (Passo 4)
   * Campos: ideacao, modelagem, prototipagem, implementacao
   */
  @Post(':uuid/passo4')
  @UseGuards(AuthGuard('jwt'))
  async salvarFasesPasso4(
    @Param('uuid') uuid: string,
    @Body() dados: Passo4ProjetoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.salvarFasesPasso4(uuid, dados, usuario);
  }

  /**
   * POST /projetos/:uuid/passo5
   * Configura repositório, privacidade e publica projeto (Passo 5)
   * Campos: has_repositorio, tipo_repositorio, link_repositorio, visibilidades, aceitou_termos
   */
  @Post(':uuid/passo5')
  @UseGuards(AuthGuard('jwt'))
  async configurarRepositorioPasso5(
    @Param('uuid') uuid: string,
    @Body() dados: Passo5ProjetoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.configurarRepositorioPasso5(uuid, dados, usuario);
  }

  /**
   * POST /projetos/validar-equipe
   * Valida se alunos e professores existem no banco antes de adicionar ao projeto
   */
  @Post('validar-equipe')
  @UseGuards(AuthGuard('jwt'))
  async validarEquipe(
    @Body() dados: { alunos_uuids?: string[]; professores_uuids?: string[] },
  ) {
    return this.projetosService.validarEquipe(dados);
  }

  /**
   * GET /projetos/:uuid/auditoria
   * Busca histórico de alterações de um projeto
   */
  @Get(':uuid/auditoria')
  @UseGuards(AuthGuard('jwt'))
  async buscarAuditoria(
    @Param('uuid') uuid: string,
    @Query('limite') limite?: string,
  ) {
    return this.projetosService.buscarAuditoria(
      uuid,
      limite ? parseInt(limite, 10) : undefined,
    );
  }

  /**
   * Resolve e-mails para UUIDs
   * POST /projetos/resolver-usuarios
   */
  @Post('resolver-usuarios')
  @UseGuards(AuthGuard('jwt'))
  async resolverUsuarios(@Body() body: { emails: string[] }) {
    return this.projetosService.resolverUsuariosPorEmail(body.emails);
  }

  /**
   * Busca usuários para autocomplete
   * GET /projetos/usuarios/busca?termo=...
   */
  @Get('usuarios/busca')
  @UseGuards(AuthGuard('jwt'))
  async buscarUsuarios(@Query('termo') termo: string) {
    return this.projetosService.buscarUsuarios(termo);
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
  @UseGuards(AuthGuard('jwt'))
  async listarMeusProjetos(@CurrentUser() usuario: any) {
    return this.projetosService.listarMeusProjetos(usuario);
  }

  /**
   * GET /projetos/:uuid
   * Busca projeto por UUID
   */
  @Get(':uuid')
  async buscarProjeto(@Param('uuid') uuid: string, @CurrentUser() usuario?: any) {
    try {
      return await this.projetosService.buscarProjeto(uuid, usuario);
    } catch (error) {
       console.error(`[API] Erro ao buscar projeto ${uuid}:`, error);
       throw error;
    }
  }

  /**
   * GET /projetos/:uuid/tem-permissao-editar
   * Verifica se o usuário logado tem permissão para editar o projeto
   */
  @Get(':uuid/tem-permissao-editar')
  @UseGuards(AuthGuard('jwt'))
  async temPermissaoEditar(@Param('uuid') uuid: string, @CurrentUser() usuario: any) {
    return this.projetosService.podeEditarProjeto(usuario, uuid);
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

  /**
   * POST /projetos/:uuid/curtir
   * Curte um projeto
   */
  @Post(':uuid/curtir')
  @UseGuards(AuthGuard('jwt'))
  async curtirProjeto(@Param('uuid') uuid: string) {
    return this.projetosService.curtirProjeto(uuid);
  }

  /**
   * POST /projetos/:uuid/visualizar
   * Registra visualização de um projeto
   */
  @Post(':uuid/visualizar')
  async visualizarProjeto(@Param('uuid') uuid: string) {
    return this.projetosService.visualizarProjeto(uuid);
  }
}
