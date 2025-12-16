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
   * @requires ALUNO
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
   * @requires PROFESSOR
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
   * @requires PROFESSOR
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
   * GET /projetos-arquivados/pendentes
   * Lista solicitações pendentes do orientador
   * @requires PROFESSOR
   */
  @Get('pendentes')
  @UseGuards(AuthGuard('jwt'))
  async listarSolicitacoesPendentes(@CurrentUser() usuario: any) {
    return this.projetosArquivadosService.listarSolicitacoesPendentes(usuario);
  }

  /**
   * GET /projetos-arquivados/minhas
   * Lista solicitações do aluno logado
   * @requires ALUNO
   */
  @Get('minhas')
  @UseGuards(AuthGuard('jwt'))
  async listarMinhasSolicitacoes(@CurrentUser() usuario: any) {
    return this.projetosArquivadosService.listarMinhasSolicitacoes(usuario);
  }

  /**
   * GET /projetos-arquivados/:uuid
   * Busca detalhes de uma solicitação específica
   * @requires Autenticado (Aluno solicitante ou Orientador responsável)
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
   * @requires Autenticado (Aluno do projeto ou Orientador)
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
