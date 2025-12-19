import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { ProjetosArquivadosDao } from './projetos-arquivados.dao';
import {
  SolicitarArquivamentoDto,
  AprovarArquivamentoDto,
  NegarArquivamentoDto,
} from './dto/arquivamento.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Injectable()
export class ProjetosArquivadosService {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly dao: ProjetosArquivadosDao,
  ) { }

  /**
   * Aluno solicita arquivamento do projeto
   */
  async solicitarArquivamento(
    dados: SolicitarArquivamentoDto,
    usuario: JwtPayload,
  ): Promise<any> {
    // Valida que usuário é aluno
    if (usuario.tipo !== 'ALUNO') {
      throw new ForbiddenException('Apenas alunos podem solicitar arquivamento de projetos');
    }

    // Verifica se o aluno pertence ao projeto
    const pertenceAoProjeto = await this.dao.verificarAlunoNoProjeto(
      dados.projeto_uuid,
      usuario.uuid,
    );

    if (!pertenceAoProjeto) {
      throw new ForbiddenException(
        'Você não tem permissão para solicitar arquivamento deste projeto',
      );
    }

    // Verifica se já existe solicitação pendente
    const solicitacaoPendente = await this.dao.verificarSolicitacaoPendente(
      dados.projeto_uuid,
    );

    if (solicitacaoPendente) {
      throw new ConflictException(
        'Já existe uma solicitação de arquivamento pendente para este projeto',
      );
    }

    // Busca orientador do projeto
    const orientadorUuid = await this.dao.buscarOrientadorDoProjeto(
      dados.projeto_uuid,
    );

    if (!orientadorUuid) {
      throw new BadRequestException(
        'Este projeto não possui orientador associado',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Cria solicitação
      const solicitacao = await this.dao.criarSolicitacao(
        dados.projeto_uuid,
        usuario.uuid,
        orientadorUuid,
        dados.justificativa,
        client,
      );

      await client.query('COMMIT');

      return {
        mensagem: 'Solicitação de arquivamento enviada com sucesso',
        solicitacao: {
          uuid: solicitacao.uuid,
          projeto_uuid: solicitacao.projeto_uuid,
          justificativa: solicitacao.justificativa,
          status: solicitacao.status,
          created_at: solicitacao.created_at,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Orientador aprova arquivamento do projeto
   */
  async aprovarArquivamento(
    dados: AprovarArquivamentoDto,
    usuario: JwtPayload,
  ): Promise<any> {
    // Valida que usuário é docente/orientador
    if (usuario.tipo !== 'DOCENTE') {
      throw new ForbiddenException('Apenas orientadores podem aprovar solicitações');
    }

    // Busca solicitação
    const solicitacao = await this.dao.buscarSolicitacaoPorUuid(
      dados.solicitacao_uuid,
    );

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    // Verifica se é o orientador responsável
    if (solicitacao.orientador_uuid !== usuario.uuid) {
      throw new ForbiddenException(
        'Você não tem permissão para aprovar esta solicitação',
      );
    }

    // Verifica se já foi respondida
    if (solicitacao.status !== 'PENDENTE') {
      throw new BadRequestException(
        `Esta solicitação já foi ${solicitacao.status.toLowerCase()}`,
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Aprova solicitação e arquiva projeto
      await this.dao.aprovarSolicitacao(dados.solicitacao_uuid, client);

      await client.query('COMMIT');

      return {
        mensagem: 'Projeto arquivado com sucesso',
        solicitacao: {
          uuid: solicitacao.uuid,
          projeto_uuid: solicitacao.projeto_uuid,
          projeto_titulo: solicitacao.projeto_titulo,
          status: 'APROVADO',
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Orientador nega arquivamento do projeto
   */
  async negarArquivamento(
    dados: NegarArquivamentoDto,
    usuario: JwtPayload,
  ): Promise<any> {
    // Valida que usuário é docente/orientador
    if (usuario.tipo !== 'DOCENTE') {
      throw new ForbiddenException('Apenas orientadores podem negar solicitações');
    }

    // Busca solicitação
    const solicitacao = await this.dao.buscarSolicitacaoPorUuid(
      dados.solicitacao_uuid,
    );

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    // Verifica se é o orientador responsável
    if (solicitacao.orientador_uuid !== usuario.uuid) {
      throw new ForbiddenException(
        'Você não tem permissão para negar esta solicitação',
      );
    }

    // Verifica se já foi respondida
    if (solicitacao.status !== 'PENDENTE') {
      throw new BadRequestException(
        `Esta solicitação já foi ${solicitacao.status.toLowerCase()}`,
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Nega solicitação
      await this.dao.negarSolicitacao(
        dados.solicitacao_uuid,
        dados.justificativa_negacao,
        client,
      );

      await client.query('COMMIT');

      return {
        mensagem: 'Solicitação de arquivamento negada',
        solicitacao: {
          uuid: solicitacao.uuid,
          projeto_uuid: solicitacao.projeto_uuid,
          projeto_titulo: solicitacao.projeto_titulo,
          status: 'NEGADO',
          justificativa_negacao: dados.justificativa_negacao,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lista solicitações pendentes do orientador
   */
  async listarSolicitacoesPendentes(usuario: JwtPayload): Promise<any> {
    if (usuario.tipo !== 'DOCENTE') {
      throw new ForbiddenException('Apenas orientadores podem acessar este recurso');
    }

    const solicitacoes = await this.dao.listarSolicitacoesPendentes(usuario.uuid);

    return {
      total: solicitacoes.length,
      solicitacoes: solicitacoes.map((s) => ({
        uuid: s.uuid,
        projeto_uuid: s.projeto_uuid,
        projeto_titulo: s.projeto_titulo,
        aluno_nome: s.aluno_nome,
        aluno_email: s.aluno_email,
        justificativa: s.justificativa,
        created_at: s.created_at,
      })),
    };
  }

  /**
   * Lista solicitações do aluno
   */
  async listarMinhasSolicitacoes(usuario: JwtPayload): Promise<any> {
    if (usuario.tipo !== 'ALUNO') {
      throw new ForbiddenException('Apenas alunos podem acessar este recurso');
    }

    const solicitacoes = await this.dao.listarSolicitacoesDoAluno(usuario.uuid);

    return {
      total: solicitacoes.length,
      solicitacoes: solicitacoes.map((s) => ({
        uuid: s.uuid,
        projeto_uuid: s.projeto_uuid,
        projeto_titulo: s.projeto_titulo,
        orientador_nome: s.orientador_nome,
        justificativa: s.justificativa,
        status: s.status,
        justificativa_negacao: s.justificativa_negacao,
        created_at: s.created_at,
        respondido_em: s.respondido_em,
      })),
    };
  }

  /**
   * Busca detalhes de uma solicitação específica
   */
  async buscarSolicitacao(uuid: string, usuario: JwtPayload): Promise<any> {
    const solicitacao = await this.dao.buscarSolicitacaoPorUuid(uuid);

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    // Verifica permissão (aluno solicitante ou orientador responsável)
    if (
      solicitacao.aluno_uuid !== usuario.uuid &&
      solicitacao.orientador_uuid !== usuario.uuid
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar esta solicitação',
      );
    }

    return {
      uuid: solicitacao.uuid,
      projeto_uuid: solicitacao.projeto_uuid,
      projeto_titulo: solicitacao.projeto_titulo,
      aluno_nome: solicitacao.aluno_nome,
      aluno_email: solicitacao.aluno_email,
      orientador_nome: solicitacao.orientador_nome,
      orientador_email: solicitacao.orientador_email,
      justificativa: solicitacao.justificativa,
      justificativa_negacao: solicitacao.justificativa_negacao,
      status: solicitacao.status,
      created_at: solicitacao.created_at,
      respondido_em: solicitacao.respondido_em,
    };
  }

  /**
   * Busca histórico de solicitações de um projeto
   */
  async buscarHistoricoProjeto(
    projetoUuid: string,
    usuario: JwtPayload,
  ): Promise<any> {
    // Verifica se usuário tem acesso ao projeto
    const temAcesso =
      usuario.tipo === 'DOCENTE' ||
      (usuario.tipo === 'ALUNO' &&
        (await this.dao.verificarAlunoNoProjeto(projetoUuid, usuario.uuid)));

    if (!temAcesso) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar o histórico deste projeto',
      );
    }

    const historico = await this.dao.buscarHistoricoProjeto(projetoUuid);

    return {
      projeto_uuid: projetoUuid,
      total: historico.length,
      solicitacoes: historico.map((s) => ({
        uuid: s.uuid,
        aluno_nome: s.aluno_nome,
        orientador_nome: s.orientador_nome,
        justificativa: s.justificativa,
        justificativa_negacao: s.justificativa_negacao,
        status: s.status,
        created_at: s.created_at,
        respondido_em: s.respondido_em,
      })),
    };
  }
}
