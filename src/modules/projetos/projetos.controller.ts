import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  NotFoundException,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
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
  constructor(private readonly projetosService: ProjetosService) {}

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
    return this.projetosService.atualizarInformacoesAcademicas(
      uuid,
      dados,
      usuario,
    );
  }

  /**
   * POST /projetos/:uuid/passo3
   * Adiciona autores e orientadores (Passo 3)
   * Campos: autores[], docentes_uuids[]
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
   * Aceita múltiplos arquivos via multipart/form-data
   *
   * Formato dos campos de arquivo:
   * - ideacao_crazy8
   * - modelagem_wireframe
   * - etc.
   */
  @Post(':uuid/passo4')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(AnyFilesInterceptor()) // Aceita arquivos com qualquer fieldname
  async salvarFasesPasso4(
    @Param('uuid') uuid: string,
    @Body() dados: Passo4ProjetoDto,
    @UploadedFiles() arquivos: Express.Multer.File[],
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.salvarFasesPasso4(
      uuid,
      dados,
      arquivos,
      usuario,
    );
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
    return this.projetosService.configurarRepositorioPasso5(
      uuid,
      dados,
      usuario,
    );
  }

  /**
   * POST /projetos/validar-equipe
   * Valida se alunos e professores existem no banco antes de adicionar ao projeto
   */
  @Post('validar-equipe')
  @UseGuards(AuthGuard('jwt'))
  async validarEquipe(
    @Body() dados: { alunos_uuids?: string[]; docentes_uuids?: string[] },
  ) {
    return this.projetosService.validarParticipantes(dados);
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
    @Query('status_fase') status_fase?: string,
    @Query('tecnologia_uuid') tecnologia_uuid?: string,
    @Query('busca') busca?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.projetosService.listarProjetos({
      departamento_uuid,
      fase,
      status_fase,
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
   * GET /projetos/:uuid/anexo/:fase/:arquivo
   * Serve arquivos de anexos protegidos (verifica permissão para anexos privados)
   */
  @Get(':uuid/anexo/:fase/:arquivo')
  async servirAnexo(
    @Param('uuid') uuid: string,
    @Param('fase') fase: string,
    @Param('arquivo') arquivo: string,
    @Res() res: Response,
    @CurrentUser() usuario?: any,
  ) {
    // Validar parâmetros para prevenir path traversal
    if (fase.includes('..') || arquivo.includes('..') || fase.includes('/') || arquivo.includes('/')) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    const fasesValidas = ['ideacao', 'modelagem', 'prototipagem', 'implementacao'];
    if (!fasesValidas.includes(fase)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    // Verificar permissão para anexos privados
    await this.projetosService.verificarPermissaoAnexo(uuid, usuario);

    // Resolver caminho físico do arquivo
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const caminhoArquivo = join(uploadPath, 'projetos', fase, arquivo);

    if (!existsSync(caminhoArquivo)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    return res.sendFile(caminhoArquivo, { root: process.cwd() });
  }

  /**
   * GET /projetos/og/:uuid
   * Retorna HTML com meta tags Open Graph para previews em redes sociais
   */
  @Get('og/:uuid')
  async openGraphMeta(@Param('uuid') uuid: string, @Res() res: Response) {
    try {
      const result = await this.projetosService.buscarDadosOG(uuid);
      if (!result) {
        return res.status(404).send('Projeto não encontrado');
      }

      const siteUrl = 'https://vitrinesenaifeira.cloud';
      const projectUrl = `${siteUrl}/vitrine/${uuid}`;
      const title = this.escapeHtml(result.titulo || 'Projeto SENAI');
      const description = this.escapeHtml(
        (result.descricao || 'Projeto acadêmico desenvolvido no SENAI-BA').substring(0, 200),
      );
      const image = result.banner_url
        ? result.banner_url.startsWith('http')
          ? result.banner_url
          : `${siteUrl}${result.banner_url.startsWith('/') ? '' : '/'}${result.banner_url}`
        : `${siteUrl}/Senai.png`;

      const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <title>${title} - Vitrine SENAI</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${projectUrl}" />
  <meta property="og:site_name" content="Vitrine de Projetos SENAI-BA" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${projectUrl}" />
</head>
<body>
  <p>Redirecionando para <a href="${projectUrl}">${title}</a>...</p>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(html);
    } catch {
      return res.status(404).send('Projeto não encontrado');
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * GET /projetos/:uuid
   * Busca projeto por UUID
   */
  @Get(':uuid')
  async buscarProjeto(
    @Param('uuid') uuid: string,
    @CurrentUser() usuario?: any,
  ) {
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
  async temPermissaoEditar(
    @Param('uuid') uuid: string,
    @CurrentUser() usuario: any,
  ) {
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
  async deletarProjeto(
    @Param('uuid') uuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.deletarProjeto(uuid, usuario);
  }

  /**
   * DELETE /projetos/:projetoUuid/anexo/:anexoUuid
   * Remove um anexo individual de uma fase do projeto
   */
  @Delete(':projetoUuid/anexo/:anexoUuid')
  @UseGuards(AuthGuard('jwt'))
  async removerAnexoFase(
    @Param('projetoUuid') projetoUuid: string,
    @Param('anexoUuid') anexoUuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosService.removerAnexoFase(
      projetoUuid,
      anexoUuid,
      usuario,
    );
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
