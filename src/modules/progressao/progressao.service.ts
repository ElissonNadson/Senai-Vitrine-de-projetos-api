import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { ProgressaoDao } from './progressao.dao';
import { ProjetosDao } from '../projetos/projetos.dao';

@Injectable()
export class ProgressaoService {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly progressaoDao: ProgressaoDao,
    private readonly projetosDao: ProjetosDao,
  ) {}

  /**
   * Verifica se projeto pode progredir automaticamente
   */
  async verificarProgressao(projetoUuid: string): Promise<any> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return this.progressaoDao.verificarCondicaoProgressao(projetoUuid);
  }

  /**
   * Força progressão manual de fase (apenas ADMIN ou orientador)
   */
  async forcarProgressao(
    projetoUuid: string,
    novaFase: string,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Valida fases permitidas
    const fasesValidas = [
      'RASCUNHO',
      'PLANEJAMENTO',
      'EM_DESENVOLVIMENTO',
      'EM_TESTE',
      'AGUARDANDO_REVISAO',
      'CONCLUIDO',
      'ARQUIVADO',
    ];

    if (!fasesValidas.includes(novaFase)) {
      throw new BadRequestException('Fase inválida');
    }

    // Apenas admin ou orientador pode forçar progressão
    let temPermissao = usuario.tipo === 'ADMIN';

    if (!temPermissao && usuario.tipo === 'PROFESSOR') {
      const professorResult = await this.pool.query(
        'SELECT uuid FROM professores WHERE usuario_uuid = $1',
        [usuario.uuid],
      );

      if (professorResult.rows.length > 0) {
        temPermissao = await this.projetosDao.verificarOrientadorProjeto(
          projetoUuid,
          professorResult.rows[0].uuid,
        );
      }
    }

    if (!temPermissao) {
      throw new ForbiddenException(
        'Apenas administradores ou orientadores podem forçar progressão',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Registra progressão
      await this.progressaoDao.registrarProgressao(
        projetoUuid,
        projeto.fase_atual,
        novaFase,
        'Progressão manual',
        usuario.uuid,
        client,
      );

      // Atualiza fase
      await this.progressaoDao.atualizarFase(projetoUuid, novaFase, client);

      await client.query('COMMIT');

      return {
        mensagem: `Fase alterada de ${projeto.fase_atual} para ${novaFase}`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Executa progressão automática se condições forem atendidas
   */
  async executarProgressaoAutomatica(projetoUuid: string): Promise<{
    progrediu: boolean;
    mensagem: string;
    faseAtual: string;
    faseNova?: string;
  }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const verificacao = await this.progressaoDao.verificarCondicaoProgressao(
      projetoUuid,
    );

    if (!verificacao.podeProgredir) {
      return {
        progrediu: false,
        mensagem: verificacao.motivo,
        faseAtual: verificacao.faseAtual,
      };
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Registra progressão automática
      await this.progressaoDao.registrarProgressao(
        projetoUuid,
        verificacao.faseAtual,
        verificacao.proximaFase!,
        'Progressão automática: ' + verificacao.motivo,
        projeto.criado_por_uuid,
        client,
      );

      // Atualiza fase
      await this.progressaoDao.atualizarFase(
        projetoUuid,
        verificacao.proximaFase!,
        client,
      );

      await client.query('COMMIT');

      return {
        progrediu: true,
        mensagem: `Projeto progrediu automaticamente de ${verificacao.faseAtual} para ${verificacao.proximaFase}`,
        faseAtual: verificacao.faseAtual,
        faseNova: verificacao.proximaFase!,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Busca histórico de progressões
   */
  async buscarHistorico(projetoUuid: string): Promise<any[]> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return this.progressaoDao.buscarHistorico(projetoUuid);
  }

  /**
   * Transfere liderança do projeto
   */
  async transferirLideranca(
    projetoUuid: string,
    novoLiderAlunoUuid: string,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verifica se novo líder é autor do projeto
    const isAutor = await this.projetosDao.verificarAutorProjeto(
      projetoUuid,
      novoLiderAlunoUuid,
    );

    if (!isAutor) {
      throw new BadRequestException(
        'O novo líder deve ser um autor do projeto',
      );
    }

    // Apenas líder atual ou admin pode transferir
    let temPermissao = usuario.tipo === 'ADMIN';

    if (!temPermissao && usuario.tipo === 'ALUNO') {
      const alunoResult = await this.pool.query(
        'SELECT uuid FROM alunos WHERE usuario_uuid = $1',
        [usuario.uuid],
      );

      if (alunoResult.rows.length > 0) {
        const liderAtualResult = await this.pool.query(
          'SELECT 1 FROM projetos_alunos WHERE projeto_uuid = $1 AND aluno_uuid = $2 AND papel = $3',
          [projetoUuid, alunoResult.rows[0].uuid, 'LIDER'],
        );

        temPermissao = liderAtualResult.rows.length > 0;
      }
    }

    if (!temPermissao) {
      throw new ForbiddenException(
        'Apenas o líder atual ou administrador pode transferir liderança',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Remove papel de líder de todos
      await client.query(
        'UPDATE projetos_alunos SET papel = $1 WHERE projeto_uuid = $2 AND papel = $3',
        ['AUTOR', projetoUuid, 'LIDER'],
      );

      // Define novo líder
      await client.query(
        'UPDATE projetos_alunos SET papel = $1 WHERE projeto_uuid = $2 AND aluno_uuid = $3',
        ['LIDER', projetoUuid, novoLiderAlunoUuid],
      );

      await client.query('COMMIT');

      return { mensagem: 'Liderança transferida com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
