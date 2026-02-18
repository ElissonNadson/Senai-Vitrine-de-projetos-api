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
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class ProjetosArquivadosService {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly dao: ProjetosArquivadosDao,
    private readonly notificacoesService: NotificacoesService,
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

      // Notifica orientador sobre a solicitação
      await this.notificacoesService.criarNotificacao(
        orientadorUuid,
        'SOLICITACAO_DESATIVACAO',
        'Solicitação de arquivamento',
        `O aluno solicitou o arquivamento do projeto. Justificativa: "${dados.justificativa}"`,
        `/projetos/${dados.projeto_uuid}`,
        { projetoTitulo: 'Projeto', solicitanteNome: usuario.nome || 'Aluno' },
      );

      // Notifica admins
      await this.notificacoesService.notificarAdmins(
        'SOLICITACAO_DESATIVACAO',
        'Solicitação de arquivamento',
        `Um aluno solicitou o arquivamento de um projeto. Justificativa: "${dados.justificativa}"`,
        `/projetos/${dados.projeto_uuid}`,
      );

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
    // Valida que usuário é docente/orientador ou admin
    if (usuario.tipo !== 'DOCENTE' && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException('Apenas orientadores e administradores podem aprovar solicitações');
    }

    // Busca solicitação
    const solicitacao = await this.dao.buscarSolicitacaoPorUuid(
      dados.solicitacao_uuid,
    );

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    // Verifica se é o orientador responsável (admin pode aprovar qualquer uma)
    if (usuario.tipo !== 'ADMIN' && solicitacao.orientador_uuid !== usuario.uuid) {
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

      // Notifica o aluno que a solicitação foi aprovada
      await this.notificacoesService.criarNotificacao(
        solicitacao.aluno_uuid,
        'SOLICITACAO_DECISAO',
        'Solicitação de arquivamento aprovada',
        `Sua solicitação de arquivamento do projeto "${solicitacao.projeto_titulo}" foi aprovada. O projeto foi arquivado.`,
        `/projetos/${solicitacao.projeto_uuid}`,
        { projetoTitulo: solicitacao.projeto_titulo, aceita: true },
      );

      // Notifica autores e orientadores que o projeto foi arquivado
      await this.notificacoesService.notificarProjetoArquivado(
        solicitacao.projeto_uuid,
        solicitacao.projeto_titulo,
      );

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
    // Valida que usuário é docente/orientador ou admin
    if (usuario.tipo !== 'DOCENTE' && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException('Apenas orientadores e administradores podem negar solicitações');
    }

    // Busca solicitação
    const solicitacao = await this.dao.buscarSolicitacaoPorUuid(
      dados.solicitacao_uuid,
    );

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    // Verifica se é o orientador responsável (admin pode negar qualquer uma)
    if (usuario.tipo !== 'ADMIN' && solicitacao.orientador_uuid !== usuario.uuid) {
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

      // Notifica o aluno que a solicitação foi negada
      await this.notificacoesService.criarNotificacao(
        solicitacao.aluno_uuid,
        'SOLICITACAO_DECISAO',
        'Solicitação de arquivamento negada',
        `Sua solicitação de arquivamento do projeto "${solicitacao.projeto_titulo}" foi negada. Motivo: "${dados.justificativa_negacao}"`,
        `/projetos/${solicitacao.projeto_uuid}`,
        { projetoTitulo: solicitacao.projeto_titulo, aceita: false },
      );

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
    if (usuario.tipo !== 'DOCENTE' && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException('Apenas orientadores e administradores podem acessar este recurso');
    }

    // Admin vê todas as solicitações pendentes; docente vê apenas as dele
    const solicitacoes = usuario.tipo === 'ADMIN'
      ? await this.dao.listarTodasSolicitacoesPendentes()
      : await this.dao.listarSolicitacoesPendentes(usuario.uuid);

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
        tipo: s.tipo || 'EXCLUSAO',
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

    // Verifica permissão (aluno solicitante, orientador responsável, ou admin)
    if (
      usuario.tipo !== 'ADMIN' &&
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
      usuario.tipo === 'ADMIN' ||
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

  /**
   * Docente desativa/arquiva projeto diretamente (sem precisar de solicitação de aluno)
   */
  async desativarDiretamente(
    projetoUuid: string,
    justificativa: string,
    usuario: JwtPayload,
  ): Promise<any> {
    if (usuario.tipo !== 'DOCENTE' && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException('Apenas docentes e administradores podem desativar projetos diretamente');
    }

    // Verifica se o projeto existe
    const projetoResult = await this.pool.query(
      'SELECT uuid, titulo, status FROM projetos WHERE uuid = $1',
      [projetoUuid],
    );
    const projeto = projetoResult.rows[0];
    if (!projeto) throw new NotFoundException('Projeto não encontrado');

    if (projeto.status === 'DESATIVADO' || projeto.status === 'ARQUIVADO') {
      throw new BadRequestException('Este projeto já está desativado');
    }

    // Verifica se o docente é orientador do projeto (ou admin)
    if (usuario.tipo === 'DOCENTE') {
      const orientadorResult = await this.pool.query(
        'SELECT 1 FROM projetos_docentes WHERE projeto_uuid = $1 AND usuario_uuid = $2',
        [projetoUuid, usuario.uuid],
      );
      if (orientadorResult.rows.length === 0) {
        throw new ForbiddenException('Você não é orientador deste projeto');
      }
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Arquiva o projeto
      await client.query(
        `UPDATE projetos SET status = 'DESATIVADO', arquivado = TRUE WHERE uuid = $1`,
        [projetoUuid],
      );

      await client.query('COMMIT');

      // Notifica todos os envolvidos
      await this.notificacoesService.notificarProjetoArquivado(projetoUuid, projeto.titulo);

      // Notifica autores com motivo
      await this.notificacoesService.notificarAutores(
        projetoUuid,
        'PROJETO_ARQUIVADO',
        'Projeto desativado pelo orientador',
        `O projeto "${projeto.titulo}" foi desativado. Motivo: "${justificativa}"`,
      );

      return { mensagem: 'Projeto desativado com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Exclui projeto permanentemente (soft delete já existente, aqui marca como EXCLUIDO)
   */
  async excluirProjeto(
    projetoUuid: string,
    justificativa: string,
    usuario: JwtPayload,
  ): Promise<any> {
    if (usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem excluir projetos permanentemente');
    }

    const projetoResult = await this.pool.query(
      'SELECT uuid, titulo, status FROM projetos WHERE uuid = $1',
      [projetoUuid],
    );
    const projeto = projetoResult.rows[0];
    if (!projeto) throw new NotFoundException('Projeto não encontrado');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE projetos SET status = 'EXCLUIDO', arquivado = TRUE WHERE uuid = $1`,
        [projetoUuid],
      );

      await client.query('COMMIT');

      await this.notificacoesService.notificarAutores(
        projetoUuid,
        'PROJETO_ARQUIVADO',
        'Projeto excluído',
        `O projeto "${projeto.titulo}" foi excluído permanentemente por um administrador. Motivo: "${justificativa}"`,
      );

      return { mensagem: 'Projeto excluído com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reativa um projeto arquivado (somente ADMIN)
   */
  async reativarProjeto(
    projetoUuid: string,
    usuario: JwtPayload,
  ): Promise<any> {
    if (usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem reativar projetos');
    }

    const projetoResult = await this.pool.query(
      'SELECT uuid, titulo, status FROM projetos WHERE uuid = $1',
      [projetoUuid],
    );
    const projeto = projetoResult.rows[0];
    if (!projeto) throw new NotFoundException('Projeto não encontrado');

    if (projeto.status !== 'DESATIVADO' && projeto.status !== 'ARQUIVADO' && projeto.status !== 'EXCLUIDO') {
      throw new BadRequestException('Apenas projetos desativados ou excluídos podem ser reativados');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE projetos SET status = 'PUBLICADO', arquivado = FALSE WHERE uuid = $1`,
        [projetoUuid],
      );

      await client.query('COMMIT');

      await this.notificacoesService.notificarAutores(
        projetoUuid,
        'PROJETO_REATIVADO',
        'Projeto reativado',
        `O projeto "${projeto.titulo}" foi reativado por um administrador e está novamente visível na vitrine.`,
      );

      return { mensagem: 'Projeto reativado com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Aluno solicita reativação de projeto excluído
   */
  async solicitarReativacao(
    projetoUuid: string,
    justificativa: string,
    usuario: JwtPayload,
  ): Promise<any> {
    if (usuario.tipo !== 'ALUNO') {
      throw new ForbiddenException('Apenas alunos podem solicitar reativação');
    }

    const pertence = await this.dao.verificarAlunoNoProjeto(projetoUuid, usuario.uuid);
    if (!pertence) {
      throw new ForbiddenException('Você não pertence a este projeto');
    }

    const projetoResult = await this.pool.query(
      'SELECT uuid, titulo, status FROM projetos WHERE uuid = $1',
      [projetoUuid],
    );
    const projeto = projetoResult.rows[0];
    if (!projeto) throw new NotFoundException('Projeto não encontrado');

    if (projeto.status !== 'DESATIVADO' && projeto.status !== 'ARQUIVADO' && projeto.status !== 'EXCLUIDO') {
      throw new BadRequestException('Este projeto não está desativado');
    }

    // Verifica se já existe solicitação de reativação pendente
    const pendente = await this.pool.query(
      `SELECT 1 FROM projetos_arquivados WHERE projeto_uuid = $1 AND tipo = 'REATIVACAO' AND status = 'PENDENTE'`,
      [projetoUuid],
    );
    if (pendente.rows.length > 0) {
      throw new ConflictException('Já existe uma solicitação de reativação pendente para este projeto');
    }

    const orientadorUuid = await this.dao.buscarOrientadorDoProjeto(projetoUuid);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO projetos_arquivados (projeto_uuid, aluno_uuid, orientador_uuid, justificativa, status, tipo)
         VALUES ($1, $2, $3, $4, 'PENDENTE', 'REATIVACAO')`,
        [projetoUuid, usuario.uuid, orientadorUuid, justificativa],
      );

      await client.query('COMMIT');

      // Notifica orientador se existir
      if (orientadorUuid) {
        await this.notificacoesService.criarNotificacao(
          orientadorUuid,
          'SOLICITACAO_DESATIVACAO',
          'Solicitação de reativação',
          `O aluno solicitou a reativação do projeto "${projeto.titulo}". Justificativa: "${justificativa}"`,
          `/projetos/${projetoUuid}`,
          { projetoTitulo: projeto.titulo, solicitanteNome: usuario.nome || 'Aluno' },
        );
      }

      // Notifica admins
      await this.notificacoesService.notificarAdmins(
        'SOLICITACAO_DESATIVACAO',
        'Solicitação de reativação',
        `Aluno solicitou reativação do projeto "${projeto.titulo}".`,
        `/projetos/${projetoUuid}`,
      );

      return { mensagem: 'Solicitação de reativação enviada com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lista todos os projetos desativados/arquivados do usuário
   */
  async listarProjetosDesativados(usuario: JwtPayload): Promise<any> {
    let query: string;
    let params: any[];

    if (usuario.tipo === 'ADMIN') {
      query = `
        SELECT p.uuid, p.titulo, p.descricao, p.status, p.banner_url,
               p.categoria, p.criado_em, p.atualizado_em,
               u.nome as criador_nome
        FROM projetos p
        LEFT JOIN usuarios u ON p.criado_por_uuid = u.uuid
        WHERE p.arquivado = TRUE OR p.status IN ('DESATIVADO', 'ARQUIVADO', 'EXCLUIDO')
        ORDER BY p.atualizado_em DESC
      `;
      params = [];
    } else if (usuario.tipo === 'DOCENTE') {
      query = `
        SELECT DISTINCT p.uuid, p.titulo, p.descricao, p.status, p.banner_url,
               p.categoria, p.criado_em, p.atualizado_em,
               u.nome as criador_nome
        FROM projetos p
        LEFT JOIN projetos_docentes pd ON p.uuid = pd.projeto_uuid
        LEFT JOIN usuarios u ON p.criado_por_uuid = u.uuid
        WHERE (pd.usuario_uuid = $1 OR p.criado_por_uuid = $1)
          AND (p.arquivado = TRUE OR p.status IN ('DESATIVADO', 'ARQUIVADO', 'EXCLUIDO'))
        ORDER BY p.atualizado_em DESC
      `;
      params = [usuario.uuid];
    } else {
      // ALUNO
      query = `
        SELECT DISTINCT p.uuid, p.titulo, p.descricao, p.status, p.banner_url,
               p.categoria, p.criado_em, p.atualizado_em,
               u.nome as criador_nome
        FROM projetos p
        LEFT JOIN projetos_alunos pa ON p.uuid = pa.projeto_uuid
        LEFT JOIN usuarios u ON p.criado_por_uuid = u.uuid
        WHERE (pa.usuario_uuid = $1 OR p.criado_por_uuid = $1)
          AND (p.arquivado = TRUE OR p.status IN ('DESATIVADO', 'ARQUIVADO', 'EXCLUIDO'))
        ORDER BY p.atualizado_em DESC
      `;
      params = [usuario.uuid];
    }

    const result = await this.pool.query(query, params);

    return {
      total: result.rows.length,
      projetos: result.rows,
    };
  }
}
