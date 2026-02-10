import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjetosArquivadosService } from './projetos-arquivados.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  SolicitarArquivamentoDto,
  AprovarArquivamentoDto,
  NegarArquivamentoDto,
} from './dto/arquivamento.dto';

@Controller('projetos-arquivados')
export class ProjetosArquivadosController {
  constructor(
    private readonly projetosArquivadosService: ProjetosArquivadosService,
  ) {}

  /**
   * POST /projetos-arquivados/solicitar
   * Aluno solicita arquivamento de projeto
   */
  @Post('solicitar')
  @UseGuards(AuthGuard('jwt'))
  async solicitarArquivamento(
    @Body() dados: SolicitarArquivamentoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosArquivadosService.solicitarArquivamento(dados, usuario);
  }

  /**
   * POST /projetos-arquivados/aprovar
   * Orientador aprova solicitação de arquivamento
   */
  @Post('aprovar')
  @UseGuards(AuthGuard('jwt'))
  async aprovarArquivamento(
    @Body() dados: AprovarArquivamentoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosArquivadosService.aprovarArquivamento(dados, usuario);
  }

  /**
   * POST /projetos-arquivados/negar
   * Orientador nega solicitação de arquivamento
   */
  @Post('negar')
  @UseGuards(AuthGuard('jwt'))
  async negarArquivamento(
    @Body() dados: NegarArquivamentoDto,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosArquivadosService.negarArquivamento(dados, usuario);
  }

  /**
   * POST /projetos-arquivados/desativar/:projetoUuid
   * Docente desativa projeto diretamente
   */
  @Post('desativar/:projetoUuid')
  @UseGuards(AuthGuard('jwt'))
  async desativarDiretamente(
    @Param('projetoUuid') projetoUuid: string,
    @Body('justificativa') justificativa: string,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosArquivadosService.desativarDiretamente(
      projetoUuid,
      justificativa || 'Desativado pelo orientador',
      usuario,
    );
  }

  /**
   * POST /projetos-arquivados/excluir/:projetoUuid
   * Admin exclui projeto permanentemente
   */
  @Post('excluir/:projetoUuid')
  @UseGuards(AuthGuard('jwt'))
  async excluirProjeto(
    @Param('projetoUuid') projetoUuid: string,
    @Body('justificativa') justificativa: string,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosArquivadosService.excluirProjeto(
      projetoUuid,
      justificativa || 'Excluído pelo administrador',
      usuario,
    );
  }

  /**
   * POST /projetos-arquivados/reativar/:projetoUuid
   * Admin reativa projeto arquivado
   */
  @Post('reativar/:projetoUuid')
  @UseGuards(AuthGuard('jwt'))
  async reativarProjeto(
    @Param('projetoUuid') projetoUuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosArquivadosService.reativarProjeto(projetoUuid, usuario);
  }

  /**
   * POST /projetos-arquivados/solicitar-reativacao/:projetoUuid
   * Aluno solicita reativação de projeto excluído
   */
  @Post('solicitar-reativacao/:projetoUuid')
  @UseGuards(AuthGuard('jwt'))
  async solicitarReativacao(
    @Param('projetoUuid') projetoUuid: string,
    @Body('justificativa') justificativa: string,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosArquivadosService.solicitarReativacao(
      projetoUuid,
      justificativa || 'Solicito a reativação deste projeto',
      usuario,
    );
  }

  /**
   * GET /projetos-arquivados/desativados
   * Lista projetos desativados/arquivados do usuário
   */
  @Get('desativados')
  @UseGuards(AuthGuard('jwt'))
  async listarProjetosDesativados(@CurrentUser() usuario: any) {
    return this.projetosArquivadosService.listarProjetosDesativados(usuario);
  }

  /**
   * GET /projetos-arquivados/pendentes
   * Lista solicitações pendentes do orientador
   */
  @Get('pendentes')
  @UseGuards(AuthGuard('jwt'))
  async listarSolicitacoesPendentes(@CurrentUser() usuario: any) {
    return this.projetosArquivadosService.listarSolicitacoesPendentes(usuario);
  }

  /**
   * GET /projetos-arquivados/minhas
   * Lista solicitações do aluno logado
   */
  @Get('minhas')
  @UseGuards(AuthGuard('jwt'))
  async listarMinhasSolicitacoes(@CurrentUser() usuario: any) {
    return this.projetosArquivadosService.listarMinhasSolicitacoes(usuario);
  }

  /**
   * GET /projetos-arquivados/:uuid
   * Busca detalhes de uma solicitação específica
   */
  @Get(':uuid')
  @UseGuards(AuthGuard('jwt'))
  async buscarSolicitacao(
    @Param('uuid') uuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosArquivadosService.buscarSolicitacao(uuid, usuario);
  }

  /**
   * GET /projetos-arquivados/projeto/:projetoUuid/historico
   * Busca histórico de solicitações de um projeto
   */
  @Get('projeto/:projetoUuid/historico')
  @UseGuards(AuthGuard('jwt'))
  async buscarHistoricoProjeto(
    @Param('projetoUuid') projetoUuid: string,
    @CurrentUser() usuario: any,
  ) {
    return this.projetosArquivadosService.buscarHistoricoProjeto(
      projetoUuid,
      usuario,
    );
  }
}
