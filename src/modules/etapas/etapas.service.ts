import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { EtapasDao } from './etapas.dao';
import { ProjetosDao } from '../projetos/projetos.dao';
import { UploadService } from '../upload/upload.service';
import {
  CreateEtapaDto,
  AdicionarAnexosDto,
  UpdateEtapaDto,
  FeedbackOrientadorDto,
  ConcluirEtapaDto,
} from './dto/create-etapa.dto';

@Injectable()
export class EtapasService {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly etapasDao: EtapasDao,
    private readonly projetosDao: ProjetosDao,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Cria nova etapa do projeto
   */
  async criarEtapa(
    projetoUuid: string,
    dados: CreateEtapaDto,
    usuario: any,
  ): Promise<{ uuid: string; mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verifica permissão (autor ou orientador)
    let temPermissao = false;

    if (usuario.tipo === 'ALUNO') {
        temPermissao = await this.projetosDao.verificarAutorProjeto(
          projetoUuid,
          usuario.uuid,
        );
    } else if (usuario.tipo === 'PROFESSOR') {
      temPermissao = await this.projetosDao.verificarOrientadorProjeto(
        projetoUuid,
        usuario.uuid,
      );
    }

    if (!temPermissao && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para criar etapas neste projeto',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const etapaUuid = await this.etapasDao.criarEtapa(
        projetoUuid,
        dados,
        usuario.uuid,
        client,
      );

      await client.query('COMMIT');

      return {
        uuid: etapaUuid,
        mensagem: 'Etapa criada com sucesso',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lista etapas do projeto
   */
  async listarEtapas(projetoUuid: string): Promise<any[]> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return this.etapasDao.listarEtapas(projetoUuid);
  }

  /**
   * Busca etapa por UUID com anexos
   */
  async buscarEtapa(etapaUuid: string): Promise<any> {
    const etapa = await this.etapasDao.buscarPorUuid(etapaUuid);

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    const anexos = await this.etapasDao.listarAnexos(etapaUuid);

    return {
      ...etapa,
      anexos,
    };
  }

  /**
   * Adiciona anexos à etapa
   */
  async adicionarAnexos(
    etapaUuid: string,
    dados: AdicionarAnexosDto,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const etapa = await this.etapasDao.buscarPorUuid(etapaUuid);

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    // Verifica permissão
    let temPermissao = false;

    if (usuario.tipo === 'ALUNO') {
      temPermissao = await this.projetosDao.verificarAutorProjeto(
        etapa.projeto_uuid,
        usuario.uuid,
      );
    } else if (usuario.tipo === 'PROFESSOR') {
      temPermissao = await this.projetosDao.verificarOrientadorProjeto(
        etapa.projeto_uuid,
        usuario.uuid,
      );
    }

    if (!temPermissao && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar anexos',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (const anexo of dados.anexos) {
        await this.etapasDao.adicionarAnexo(etapaUuid, anexo, client);
      }

      await client.query('COMMIT');

      return {
        mensagem: `${dados.anexos.length} anexo(s) adicionado(s) com sucesso`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Atualiza etapa
   */
  async atualizarEtapa(
    etapaUuid: string,
    dados: UpdateEtapaDto,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const etapa = await this.etapasDao.buscarPorUuid(etapaUuid);

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    // Verifica permissão
    let temPermissao = false;

    if (usuario.tipo === 'ALUNO') {
      temPermissao = await this.projetosDao.verificarAutorProjeto(
        etapa.projeto_uuid,
        usuario.uuid,
      );
    }

    if (!temPermissao && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar esta etapa',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      await this.etapasDao.atualizarEtapa(etapaUuid, dados, client);

      await client.query('COMMIT');

      return { mensagem: 'Etapa atualizada com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Orientador fornece feedback sobre etapa
   */
  async fornecerFeedback(
    etapaUuid: string,
    dados: FeedbackOrientadorDto,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    if (usuario.tipo !== 'PROFESSOR' && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException('Apenas orientadores podem fornecer feedback');
    }

    const etapa = await this.etapasDao.buscarPorUuid(etapaUuid);

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    if (etapa.status !== 'PENDENTE_ORIENTADOR') {
      throw new BadRequestException(
        'Esta etapa não está pendente de feedback',
      );
    }

    // Verifica se é orientador do projeto
    const professorResult = await this.pool.query(
      'SELECT uuid FROM professores WHERE usuario_uuid = $1',
      [usuario.uuid],
    );

    if (professorResult.rows.length === 0 && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException('Perfil de professor não encontrado');
    }

    if (usuario.tipo !== 'ADMIN') {
      const isOrientador = await this.projetosDao.verificarOrientadorProjeto(
        etapa.projeto_uuid,
        professorResult.rows[0].uuid,
      );

      if (!isOrientador) {
        throw new ForbiddenException(
          'Você não é orientador deste projeto',
        );
      }
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      await this.etapasDao.registrarFeedback(
        etapaUuid,
        dados.status,
        dados.comentario,
        usuario.uuid,
        client,
      );

      await client.query('COMMIT');

      return { mensagem: 'Feedback registrado com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Marca etapa como concluída (aguarda feedback do orientador)
   */
  async concluirEtapa(
    etapaUuid: string,
    dados: ConcluirEtapaDto,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const etapa = await this.etapasDao.buscarPorUuid(etapaUuid);

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    if (etapa.status !== 'EM_ANDAMENTO') {
      throw new BadRequestException(
        'Apenas etapas em andamento podem ser concluídas',
      );
    }

    // Verifica se há pelo menos 1 anexo
    const totalAnexos = await this.etapasDao.contarAnexos(etapaUuid);
    if (totalAnexos === 0) {
      throw new BadRequestException(
        'É necessário ter pelo menos um documento anexado para concluir esta etapa.',
      );
    }

    // Verifica permissão (autor)
    let temPermissao = false;

    if (usuario.tipo === 'ALUNO') {
      temPermissao = await this.projetosDao.verificarAutorProjeto(
        etapa.projeto_uuid,
        usuario.uuid,
      );
    }

    if (!temPermissao && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para concluir esta etapa',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      await this.etapasDao.concluirEtapa(etapaUuid, dados.observacoes, client);

      await client.query('COMMIT');

      return {
        mensagem:
          'Etapa concluída! Aguardando feedback do orientador.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deleta etapa
   */
  async deletarEtapa(
    etapaUuid: string,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const etapa = await this.etapasDao.buscarPorUuid(etapaUuid);

    if (!etapa) {
      throw new NotFoundException('Etapa não encontrada');
    }

    // Verifica permissão (autor ou admin)
    let temPermissao = usuario.tipo === 'ADMIN';

    if (!temPermissao && usuario.tipo === 'ALUNO') {
      temPermissao = await this.projetosDao.verificarAutorProjeto(
        etapa.projeto_uuid,
        usuario.uuid,
      );
    }

    if (!temPermissao) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar esta etapa',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Busca anexos para deletar arquivos
      const anexos = await this.etapasDao.listarAnexos(etapaUuid);

      // Deleta etapa (CASCADE deleta anexos do banco)
      await this.etapasDao.deletarEtapa(etapaUuid, client);

      // Deleta arquivos físicos
      for (const anexo of anexos) {
        await this.uploadService.deletarArquivo(anexo.url);
      }

      await client.query('COMMIT');

      return { mensagem: 'Etapa deletada com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deleta anexo específico
   */
  async deletarAnexo(
    anexoUuid: string,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    // Busca informações do anexo e etapa
    const anexoResult = await this.pool.query(
      `SELECT ae.url, ep.projeto_uuid 
       FROM anexos_etapas ae
       INNER JOIN etapas_projeto ep ON ae.etapa_uuid = ep.uuid
       WHERE ae.uuid = $1`,
      [anexoUuid],
    );

    if (anexoResult.rows.length === 0) {
      throw new NotFoundException('Anexo não encontrado');
    }

    const { url, projeto_uuid } = anexoResult.rows[0];

    // Verifica permissão
    let temPermissao = usuario.tipo === 'ADMIN';

    if (!temPermissao && usuario.tipo === 'ALUNO') {
      temPermissao = await this.projetosDao.verificarAutorProjeto(
        projeto_uuid,
        usuario.uuid,
      );
    }

    if (!temPermissao) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar este anexo',
      );
    }

    // Deleta do banco
    await this.etapasDao.deletarAnexo(anexoUuid);

    // Deleta arquivo físico
    await this.uploadService.deletarArquivo(url);

    return { mensagem: 'Anexo deletado com sucesso' };
  }
}
