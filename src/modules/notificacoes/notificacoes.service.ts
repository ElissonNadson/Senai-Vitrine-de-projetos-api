import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { NotificacoesDao } from './notificacoes.dao';
import { enqueueEmail } from '../../common/publishers/emailPublisher';
import { assuntoPorTipo } from '../../common/utils/email-templates.util';
import { gerarHtmlEmail } from '../../common/utils/email-html-templates.util';

@Injectable()
export class NotificacoesService {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly notificacoesDao: NotificacoesDao,
  ) { }

  /**
   * Cria notificação para usuário(s) e envia email estilizado via fila RabbitMQ.
   * @param extras Dados extras para personalizar o template de email (projetoTitulo, diff, papel, etc.)
   */
  async criarNotificacao(
    usuarioUuid: string | string[],
    tipo: string,
    titulo: string,
    mensagem: string,
    linkRelacionado?: string,
    extras?: Record<string, any>,
  ): Promise<void> {
    const usuarios = Array.isArray(usuarioUuid) ? usuarioUuid : [usuarioUuid];

    for (const uuid of usuarios) {
      const subjectTitle = titulo || assuntoPorTipo(tipo);
      await this.notificacoesDao.criarNotificacao(
        uuid,
        tipo,
        subjectTitle,
        mensagem,
        linkRelacionado,
      );

      // Envia email via fila RabbitMQ, se habilitado
      if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
        console.log(`[DEBUG] Tentando enviar email para usuario ${uuid} sobre ${titulo}`);
        try {
          const userResult = await this.pool.query(
            'SELECT nome, email FROM usuarios WHERE uuid = $1 AND ativo = TRUE',
            [uuid],
          );
          const user = userResult.rows[0];
          if (user && user.email) {
            console.log(`[DEBUG] Usuario encontrado: ${user.email}. Enfileirando email...`);
            const frontendUrl = process.env.FRONTEND_URL || '';
            const fullLink = linkRelacionado ? `${frontendUrl}${linkRelacionado}` : undefined;

            await enqueueEmail({
              to: { email: user.email, name: user.nome },
              subject: subjectTitle,
              textContent: mensagem,
              htmlContent: gerarHtmlEmail(tipo, mensagem, fullLink, extras),
              tipo,
              linkRelacionado,
            });
            console.log(`[DEBUG] Email enfileirado com sucesso para ${user.email}`);
          } else {
            console.log(`[DEBUG] Usuario ${uuid} nao encontrado ou sem email.`);
          }
        } catch (err: any) {
          console.error(`[DEBUG] Erro ao enviar email: ${err.message}`, err);
          // Não bloqueia criação de notificação se email falhar
        }
      } else {
        console.log(`[DEBUG] Envio de email desabilitado (SEND_EMAIL_NOTIFICATIONS=${process.env.SEND_EMAIL_NOTIFICATIONS})`);
      }
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
       INNER JOIN alunos a ON pa.usuario_uuid = a.usuario_uuid
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
       FROM projetos_docentes pp
       INNER JOIN docentes p ON pp.usuario_uuid = p.usuario_uuid
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
   * Notifica todos os administradores do sistema
   */
  async notificarAdmins(
    tipo: string,
    titulo: string,
    mensagem: string,
    linkRelacionado?: string,
    extras?: Record<string, any>,
  ): Promise<void> {
    const adminsResult = await this.pool.query(
      `SELECT uuid FROM usuarios WHERE tipo = 'ADMIN' AND ativo = TRUE`,
    );
    const uuids = adminsResult.rows.map((r) => r.uuid);
    if (uuids.length > 0) {
      await this.criarNotificacao(uuids, tipo, titulo, mensagem, linkRelacionado, extras);
    }
  }

  /**
   * Notifica membros removidos de um projeto
   */
  async notificarMembrosRemovidos(
    removidosUuids: string[],
    projetoTitulo: string,
    projetoUuid: string,
  ): Promise<void> {
    if (!removidosUuids || removidosUuids.length === 0) return;

    await this.criarNotificacao(
      removidosUuids,
      'VINCULO_REMOVIDO',
      'Você foi removido de um projeto',
      `Você foi removido do projeto "${projetoTitulo}"`,
      `/projetos/${projetoUuid}`,
      { projetoTitulo },
    );
  }

  /**
   * Notifica todos os envolvidos quando um projeto é arquivado
   */
  async notificarProjetoArquivado(
    projetoUuid: string,
    projetoTitulo: string,
  ): Promise<void> {
    await this.notificarAutores(
      projetoUuid,
      'PROJETO_ARQUIVADO',
      'Projeto arquivado',
      `O projeto "${projetoTitulo}" foi arquivado.`,
    );
    await this.notificarOrientadores(
      projetoUuid,
      'PROJETO_ARQUIVADO',
      'Projeto arquivado',
      `O projeto "${projetoTitulo}" foi arquivado.`,
    );
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
