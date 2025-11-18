import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { NotificacoesDao } from './notificacoes.dao';

@Injectable()
export class NotificacoesService {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly notificacoesDao: NotificacoesDao,
  ) {}

  /**
   * Cria notificação para usuário(s)
   */
  async criarNotificacao(
    usuarioUuid: string | string[],
    tipo: string,
    titulo: string,
    mensagem: string,
    linkRelacionado?: string,
  ): Promise<void> {
    const usuarios = Array.isArray(usuarioUuid) ? usuarioUuid : [usuarioUuid];

    for (const uuid of usuarios) {
      await this.notificacoesDao.criarNotificacao(
        uuid,
        tipo,
        titulo,
        mensagem,
        linkRelacionado,
      );
    }
  }

  /**
   * Notifica autores do projeto
   */
  async notificarAutores(
    projetoUuid: string,
    tipo: string,
    titulo: string,
    mensagem: string,
  ): Promise<void> {
    const autoresResult = await this.pool.query(
      `SELECT a.usuario_uuid 
       FROM projetos_alunos pa
       INNER JOIN alunos a ON pa.aluno_uuid = a.uuid
       WHERE pa.projeto_uuid = $1`,
      [projetoUuid],
    );

    const usuariosUuids = autoresResult.rows.map((r) => r.usuario_uuid);

    await this.criarNotificacao(
      usuariosUuids,
      tipo,
      titulo,
      mensagem,
      `/projetos/${projetoUuid}`,
    );
  }

  /**
   * Notifica orientadores do projeto
   */
  async notificarOrientadores(
    projetoUuid: string,
    tipo: string,
    titulo: string,
    mensagem: string,
  ): Promise<void> {
    const orientadoresResult = await this.pool.query(
      `SELECT p.usuario_uuid 
       FROM projetos_professores pp
       INNER JOIN professores p ON pp.professor_uuid = p.uuid
       WHERE pp.projeto_uuid = $1`,
      [projetoUuid],
    );

    const usuariosUuids = orientadoresResult.rows.map((r) => r.usuario_uuid);

    await this.criarNotificacao(
      usuariosUuids,
      tipo,
      titulo,
      mensagem,
      `/projetos/${projetoUuid}`,
    );
  }

  /**
   * Lista notificações do usuário
   */
  async listarNotificacoes(
    usuario: any,
    apenasNaoLidas: boolean = false,
  ): Promise<any[]> {
    return this.notificacoesDao.listarNotificacoes(
      usuario.uuid,
      apenasNaoLidas,
    );
  }

  /**
   * Conta não lidas
   */
  async contarNaoLidas(usuario: any): Promise<{ total: number }> {
    const total = await this.notificacoesDao.contarNaoLidas(usuario.uuid);
    return { total };
  }

  /**
   * Marca notificação como lida
   */
  async marcarComoLida(
    notificacaoUuid: string,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const notificacao = await this.notificacoesDao.buscarPorUuid(
      notificacaoUuid,
    );

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    if (notificacao.usuario_uuid !== usuario.uuid) {
      throw new ForbiddenException(
        'Você não tem permissão para marcar esta notificação',
      );
    }

    await this.notificacoesDao.marcarComoLida(notificacaoUuid);

    return { mensagem: 'Notificação marcada como lida' };
  }

  /**
   * Marca todas como lidas
   */
  async marcarTodasComoLidas(usuario: any): Promise<{ mensagem: string }> {
    const total = await this.notificacoesDao.marcarTodasComoLidas(usuario.uuid);

    return { mensagem: `${total} notificação(ões) marcada(s) como lida(s)` };
  }

  /**
   * Deleta notificação
   */
  async deletarNotificacao(
    notificacaoUuid: string,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const notificacao = await this.notificacoesDao.buscarPorUuid(
      notificacaoUuid,
    );

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    if (notificacao.usuario_uuid !== usuario.uuid) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar esta notificação',
      );
    }

    await this.notificacoesDao.deletarNotificacao(notificacaoUuid);

    return { mensagem: 'Notificação deletada' };
  }

  /**
   * Helpers para eventos automáticos
   */

  async notificarNovaEtapa(
    projetoUuid: string,
    etapaTitulo: string,
  ): Promise<void> {
    await this.notificarOrientadores(
      projetoUuid,
      'NOVA_ETAPA',
      'Nova etapa criada',
      `Uma nova etapa "${etapaTitulo}" foi adicionada ao projeto`,
    );
  }

  async notificarEtapaConcluida(
    projetoUuid: string,
    etapaTitulo: string,
  ): Promise<void> {
    await this.notificarOrientadores(
      projetoUuid,
      'ETAPA_CONCLUIDA',
      'Etapa aguardando feedback',
      `A etapa "${etapaTitulo}" foi concluída e aguarda seu feedback`,
    );
  }

  async notificarFeedbackRecebido(
    projetoUuid: string,
    etapaTitulo: string,
    status: string,
  ): Promise<void> {
    const statusTexto =
      status === 'APROVADO'
        ? 'aprovada'
        : status === 'REVISAR'
          ? 'precisa de revisão'
          : 'rejeitada';

    await this.notificarAutores(
      projetoUuid,
      'FEEDBACK_RECEBIDO',
      'Feedback recebido',
      `A etapa "${etapaTitulo}" foi ${statusTexto} pelo orientador`,
    );
  }

  async notificarProgressaoFase(
    projetoUuid: string,
    faseNova: string,
  ): Promise<void> {
    await this.notificarAutores(
      projetoUuid,
      'PROGRESSAO_FASE',
      'Projeto progrediu de fase',
      `Seu projeto progrediu para a fase: ${faseNova}`,
    );
  }
}
