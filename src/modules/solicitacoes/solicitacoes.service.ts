import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { SolicitacoesDao } from './solicitacoes.dao';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class SolicitacoesService {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly solicitacoesDao: SolicitacoesDao,
    private readonly notificacoesService: NotificacoesService,
  ) { }

  async criarSolicitacaoDesativacao(
    projetoUuid: string,
    motivo: string,
    usuario: any,
  ): Promise<{ uuid: string; mensagem: string }> {
    const projetoResult = await this.pool.query(
      'SELECT uuid, titulo FROM projetos WHERE uuid = $1',
      [projetoUuid],
    );
    const projeto = projetoResult.rows[0];
    if (!projeto) throw new NotFoundException('Projeto não encontrado');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const solicitacaoUuid = await this.solicitacoesDao.criarSolicitacaoDesativacao(
        projetoUuid,
        usuario.uuid,
        motivo,
        client,
      );
      await client.query('COMMIT');

      await this.notificacoesService.notificarOrientadores(
        projetoUuid,
        'SOLICITACAO_DESATIVACAO',
        'Solicitação de desativação',
        `O projeto "${projeto.titulo}" teve solicitação de desativação por ${usuario.nome || 'um usuário'}.`,
      );

      // Notifica autores do projeto
      await this.notificacoesService.notificarAutores(
        projetoUuid,
        'SOLICITACAO_DESATIVACAO',
        'Solicitação de desativação',
        `O projeto "${projeto.titulo}" teve solicitação de desativação por ${usuario.nome || 'um usuário'}.`,
      );

      // Notifica administradores
      await this.notificacoesService.notificarAdmins(
        'SOLICITACAO_DESATIVACAO',
        'Solicitação de desativação',
        `O projeto "${projeto.titulo}" teve solicitação de desativação por ${usuario.nome || 'um usuário'}.`,
        `/projetos/${projetoUuid}`,
        { projetoTitulo: projeto.titulo, solicitanteNome: usuario.nome || 'Usuário' },
      );

      return { uuid: solicitacaoUuid, mensagem: 'Solicitação criada' };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async decidirSolicitacao(
    solicitacaoUuid: string,
    aceitar: boolean,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const solicitacao = await this.solicitacoesDao.buscarSolicitacao(solicitacaoUuid);
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada');

    const orientadorResult = await this.pool.query(
      'SELECT 1 FROM projetos_docentes WHERE projeto_uuid = $1 AND usuario_uuid = $2',
      [solicitacao.projeto_uuid, usuario.uuid],
    );
    const isAdmin = usuario.tipo === 'ADMIN';
    if (!isAdmin && orientadorResult.rows.length === 0) {
      throw new ForbiddenException('Sem permissão para decidir a solicitação');
    }

    const status = aceitar ? 'ACEITA' : 'REJEITADA';
    await this.solicitacoesDao.decidirSolicitacao(solicitacaoUuid, status as any);

    // Notifica o solicitante sobre a decisão
    await this.notificacoesService.criarNotificacao(
      solicitacao.solicitante_uuid,
      'SOLICITACAO_DECISAO',
      'Solicitação de desativação',
      `Sua solicitação de desativação do projeto "${solicitacao.projeto_titulo}" foi ${status}.`,
      `/projetos/${solicitacao.projeto_uuid}`,
      { projetoTitulo: solicitacao.projeto_titulo, aceita: aceitar },
    );

    // Notifica autores e orientadores sobre a decisão
    await this.notificacoesService.notificarAutores(
      solicitacao.projeto_uuid,
      'SOLICITACAO_DECISAO',
      'Decisão sobre desativação',
      `A solicitação de desativação do projeto "${solicitacao.projeto_titulo}" foi ${status}.`,
    );
    await this.notificacoesService.notificarOrientadores(
      solicitacao.projeto_uuid,
      'SOLICITACAO_DECISAO',
      'Decisão sobre desativação',
      `A solicitação de desativação do projeto "${solicitacao.projeto_titulo}" foi ${status}.`,
    );

    return { mensagem: `Solicitação ${status.toLowerCase()}` };
  }
}
