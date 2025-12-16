import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { ProjetosDao } from './projetos.dao';
import {
  Passo1ProjetoDto,
  Passo2ProjetoDto,
  Passo3ProjetoDto,
  Passo4ProjetoDto,
  Passo5ProjetoDto,
  UpdateProjetoDto,
} from './dto/create-projeto.dto';
import { censurarEmail } from '../../common/utils/email-validator.util';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { formatarDiff, diffLista } from '../../common/utils/diff.util';

@Injectable()
export class ProjetosService {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly projetosDao: ProjetosDao,
    private readonly notificacoesService: NotificacoesService,
  ) { }

  /**
   * Passo 1: Criar rascunho com informações básicas
   */
  async criarPasso1(
    dados: Passo1ProjetoDto,
    usuario: any,
  ): Promise<{ uuid: string; mensagem: string }> {
    // Valida que usuário é aluno
    if (usuario.tipo !== 'ALUNO') {
      throw new ForbiddenException('Apenas alunos podem criar projetos');
    }

    // Verifica se título já existe
    const tituloExiste = await this.projetosDao.verificarTituloExistente(
      dados.titulo,
    );

    if (tituloExiste) {
      throw new ConflictException(
        'Já existe um projeto com este título. Por favor, escolha outro título.',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Busca UUID do aluno
      // Cria rascunho (passa usuario.uuid para as FKs criado_por_uuid e lider_uuid)
      const projetoUuid = await this.projetosDao.criarRascunho(
        dados,
        usuario.uuid,
        client,
      );

      // Adiciona criador como líder automaticamente
      await this.projetosDao.adicionarAutores(
        projetoUuid,
        [{ usuario_uuid: usuario.uuid, papel: 'LIDER' }],
        client,
      );

      // Registra auditoria
      await this.projetosDao.registrarAuditoria(
        projetoUuid,
        usuario.uuid,
        'CRIACAO',
        'Projeto criado pelo aluno',
        null,
        {
          titulo: dados.titulo,
          descricao: dados.descricao,
          categoria: dados.categoria,
          lider_uuid: usuario.uuid,
        },
        usuario.ip,
        usuario.userAgent,
        client,
      );

      await client.query('COMMIT');

      await this.notificacoesService.criarNotificacao(
        usuario.uuid,
        'PROJETO_CRIADO',
        'Projeto criado',
        `Seu projeto "${dados.titulo}" foi criado.`,
        `/projetos/${projetoUuid}`,
      );

      return {
        uuid: projetoUuid,
        mensagem: 'Rascunho criado com sucesso. Prossiga para o Passo 2.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Passo 2: Atualizar informações acadêmicas
   */
  async atualizarInformacoesAcademicas(
    projetoUuid: string,
    dados: Passo2ProjetoDto,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verifica permissão
    const alunoResult = await this.pool.query(
      'SELECT 1 FROM alunos WHERE usuario_uuid = $1',
      [usuario.uuid],
    );

    if (alunoResult.rows.length === 0) {
      throw new ForbiddenException('Apenas alunos podem editar este projeto');
    }

    const alunoUuid = usuario.uuid;
    const isAutor = await this.projetosDao.verificarAutorProjeto(
      projetoUuid,
      alunoUuid,
    );

    if (!isAutor && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para editar este projeto',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Captura estado anterior
      const dadosAnteriores = {
        curso: projeto.curso,
        turma: projeto.turma,
        modalidade: projeto.modalidade,
        unidade_curricular: projeto.unidade_curricular,
        itinerario: projeto.itinerario,
        senai_lab: projeto.senai_lab,
        saga_senai: projeto.saga_senai,
      };

      await this.projetosDao.atualizarInformacoesAcademicas(
        projetoUuid,
        dados,
        client,
      );

      // Registra auditoria
      await this.projetosDao.registrarAuditoria(
        projetoUuid,
        usuario.uuid,
        'ATUALIZACAO_PASSO2',
        'Informações acadêmicas atualizadas',
        dadosAnteriores,
        dados,
        usuario.ip,
        usuario.userAgent,
        client,
      );

      await client.query('COMMIT');

      const labels = {
        curso: 'Curso',
        turma: 'Turma',
        modalidade: 'Modalidade',
        unidade_curricular: 'Unidade curricular',
        itinerario: 'Itinerário',
        senai_lab: 'SENAI Lab',
        saga_senai: 'Saga SENAI',
      } as any;
      const diff = formatarDiff(dadosAnteriores, dados, undefined, labels);
      if (diff && diff.length > 0) {
        await this.notificacoesService.notificarAutores(
          projetoUuid,
          'PROJETO_ATUALIZADO',
          'Projeto atualizado',
          `O projeto "${projeto.titulo}" teve alterações:\n${diff}`,
        );
        await this.notificacoesService.notificarOrientadores(
          projetoUuid,
          'PROJETO_ATUALIZADO',
          'Projeto atualizado',
          `O projeto "${projeto.titulo}" teve alterações:\n${diff}`,
        );
      }

      return {
        mensagem: 'Informações acadêmicas atualizadas. Prossiga para o Passo 3.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Passo 3: Adicionar autores e orientadores
   */
  async adicionarEquipePasso3(
    projetoUuid: string,
    dados: Passo3ProjetoDto,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verifica permissão
    const alunoResult = await this.pool.query(
      'SELECT 1 FROM alunos WHERE usuario_uuid = $1',
      [usuario.uuid],
    );

    if (alunoResult.rows.length === 0) {
      throw new ForbiddenException('Apenas alunos podem editar este projeto');
    }

    const alunoUuid = usuario.uuid;
    const isAutor = await this.projetosDao.verificarAutorProjeto(
      projetoUuid,
      alunoUuid,
    );

    if (!isAutor && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para editar este projeto',
      );
    }

    // Valida que existe exatamente 1 líder
    const lideres = dados.autores.filter((a) => a.papel === 'LIDER');
    if (lideres.length !== 1) {
      throw new BadRequestException('Projeto deve ter exatamente 1 líder');
    }

    // Valida se todos os alunos existem
    const alunosUuids = dados.autores.map(a => a.usuario_uuid);
    const validacaoAlunos = await this.projetosDao.validarAlunos(alunosUuids);

    if (validacaoAlunos.invalidos.length > 0) {
      throw new BadRequestException(
        `Os seguintes alunos não foram encontrados: ${validacaoAlunos.invalidos.join(', ')}`
      );
    }

    // Valida se todos os professores existem
    const validacaoProfessores = await this.projetosDao.validarProfessores(dados.orientadores_uuids);

    if (validacaoProfessores.invalidos.length > 0) {
      throw new BadRequestException(
        `Os seguintes professores não foram encontrados: ${validacaoProfessores.invalidos.join(', ')}`
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Captura equipe anterior para auditoria
      const autoresAnteriores = await this.projetosDao.buscarAutores(projetoUuid);
      const orientadoresAnteriores = await this.projetosDao.buscarOrientadores(projetoUuid);

      // Remove autores e orientadores atuais
      await client.query(
        'DELETE FROM projetos_alunos WHERE projeto_uuid = $1',
        [projetoUuid],
      );
      await client.query(
        'DELETE FROM projetos_professores WHERE projeto_uuid = $1',
        [projetoUuid],
      );

      // Adiciona autores
      await this.projetosDao.adicionarAutores(projetoUuid, dados.autores, client);

      // Adiciona orientadores
      await this.projetosDao.adicionarOrientadores(
        projetoUuid,
        dados.orientadores_uuids,
        client,
      );

      // Registra auditoria
      await this.projetosDao.registrarAuditoria(
        projetoUuid,
        usuario.uuid,
        'ATUALIZACAO_PASSO3',
        'Equipe (autores e orientadores) atualizada',
        {
          autores: autoresAnteriores.map(a => ({ uuid: a.usuario_uuid, papel: a.papel })),
          orientadores: orientadoresAnteriores.map(o => o.usuario_uuid),
        },
        {
          autores: dados.autores,
          orientadores: dados.orientadores_uuids,
        },
        usuario.ip,
        usuario.userAgent,
        client,
      );

      await client.query('COMMIT');

      const antigosAutoresUuids = autoresAnteriores.map(a => String(a.usuario_uuid));
      const novosAutoresUuids = (dados.autores || []).map(a => String(a.usuario_uuid));
      const autoresDiff = diffLista(antigosAutoresUuids, novosAutoresUuids);
      for (const uuid of autoresDiff.adicionados) {
        await this.notificacoesService.criarNotificacao(
          uuid,
          'VINCULO_ADICIONADO',
          'Você foi adicionado ao projeto',
          `Você foi adicionado ao projeto "${projeto.titulo}"`,
          `/projetos/${projetoUuid}`,
        );
      }
      const antigosOrientadoresUuids = orientadoresAnteriores.map(o => String(o.usuario_uuid));
      const novosOrientadoresUuids = (dados.orientadores_uuids || []).map(String);
      const orientadoresDiff = diffLista(antigosOrientadoresUuids, novosOrientadoresUuids);
      for (const uuid of orientadoresDiff.adicionados) {
        await this.notificacoesService.criarNotificacao(
          uuid,
          'VINCULO_ADICIONADO',
          'Você foi adicionado ao projeto',
          `Você foi adicionado ao projeto "${projeto.titulo}"`,
          `/projetos/${projetoUuid}`,
        );
      }

      return {
        mensagem: 'Equipe adicionada com sucesso. Prossiga para o Passo 4.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Passo 4: Salvar fases do projeto (ideação, modelagem, prototipagem, implementação)
   */
  async salvarFasesPasso4(
    projetoUuid: string,
    dados: Passo4ProjetoDto,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verifica permissão
    const alunoResult = await this.pool.query(
      'SELECT 1 FROM alunos WHERE usuario_uuid = $1',
      [usuario.uuid],
    );

    if (alunoResult.rows.length === 0) {
      throw new ForbiddenException('Apenas alunos podem editar este projeto');
    }

    const alunoUuid = usuario.uuid;
    const isAutor = await this.projetosDao.verificarAutorProjeto(
      projetoUuid,
      alunoUuid,
    );

    if (!isAutor && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para editar este projeto',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Captura fases anteriores para auditoria
      const fasesAnteriores = await this.projetosDao.buscarFasesProjeto(projetoUuid);

      // Salvar cada fase
      const fases = [
        { nome: 'ideacao', dados: dados.ideacao, ordem: 1 },
        { nome: 'modelagem', dados: dados.modelagem, ordem: 2 },
        { nome: 'prototipagem', dados: dados.prototipagem, ordem: 3 },
        { nome: 'implementacao', dados: dados.implementacao, ordem: 4 },
      ];

      for (const fase of fases) {
        if (fase.dados) {
          // Salvar descrição da fase
          const faseUuid = await this.projetosDao.salvarFaseProjeto(
            projetoUuid,
            fase.nome,
            fase.dados.descricao || '',
            fase.ordem,
            client,
          );

          // Remover anexos antigos e salvar novos
          await this.projetosDao.removerAnexosFase(faseUuid, client);

          if (fase.dados.anexos && fase.dados.anexos.length > 0) {
            for (const anexo of fase.dados.anexos) {
              await this.projetosDao.salvarAnexoFase(faseUuid, anexo, client);
            }
          }
        }
      }

      // Registra auditoria
      await this.projetosDao.registrarAuditoria(
        projetoUuid,
        usuario.uuid,
        'ATUALIZACAO_PASSO4',
        'Fases do projeto (Ideação, Modelagem, Prototipagem, Implementação) atualizadas',
        { fases: fasesAnteriores },
        { fases: dados },
        usuario.ip,
        usuario.userAgent,
        client,
      );

      // Calcular e atualizar fase atual
      const novaFase = this.calcularFaseAtual(dados);
      await this.projetosDao.atualizarFaseAtual(projetoUuid, novaFase, client);

      await client.query('COMMIT');

      const fasesAlteradas: string[] = [];
      if (dados.ideacao) fasesAlteradas.push('Ideação');
      if (dados.modelagem) fasesAlteradas.push('Modelagem');
      if (dados.prototipagem) fasesAlteradas.push('Prototipagem');
      if (dados.implementacao) fasesAlteradas.push('Implementação');
      const resumo = fasesAlteradas.length > 0 ? `Fases alteradas: ${fasesAlteradas.join(', ')}` : '';
      await this.notificacoesService.notificarAutores(
        projetoUuid,
        'PROJETO_ATUALIZADO',
        'Projeto atualizado',
        `O projeto "${projeto.titulo}" teve atualizações nas fases. ${resumo}`,
      );
      await this.notificacoesService.notificarOrientadores(
        projetoUuid,
        'PROJETO_ATUALIZADO',
        'Projeto atualizado',
        `O projeto "${projeto.titulo}" teve atualizações nas fases. ${resumo}`,
      );

      return {
        mensagem: 'Fases do projeto salvas com sucesso. Prossiga para o Passo 5.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Passo 5: Configurar repositório e privacidade
   */
  async configurarRepositorioPasso5(
    projetoUuid: string,
    dados: Passo5ProjetoDto,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verifica permissão
    const alunoResult = await this.pool.query(
      'SELECT 1 FROM alunos WHERE usuario_uuid = $1',
      [usuario.uuid],
    );

    if (alunoResult.rows.length === 0) {
      throw new ForbiddenException('Apenas alunos podem editar este projeto');
    }

    const alunoUuid = usuario.uuid;
    const isAutor = await this.projetosDao.verificarAutorProjeto(
      projetoUuid,
      alunoUuid,
    );

    if (!isAutor && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para editar este projeto',
      );
    }

    // Valida que termos foram aceitos
    if (!dados.aceitou_termos) {
      throw new BadRequestException(
        'Você deve aceitar os termos de uso para publicar o projeto',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Captura estado anterior
      const dadosAnteriores = {
        has_repositorio: projeto.has_repositorio,
        link_repositorio: projeto.link_repositorio,
        codigo_visibilidade: projeto.codigo_visibilidade,
        anexos_visibilidade: projeto.anexos_visibilidade,
        status: projeto.status,
      };

      // Atualizar configurações de repositório e privacidade
      await this.projetosDao.atualizarRepositorioPrivacidade(
        projetoUuid,
        dados,
        client,
      );

      // Publicar projeto
      await client.query(
        `UPDATE projetos 
         SET status = 'PUBLICADO', 
             data_publicacao = CURRENT_TIMESTAMP
         WHERE uuid = $1`,
        [projetoUuid],
      );

      // Registra auditoria de atualização e publicação
      await this.projetosDao.registrarAuditoria(
        projetoUuid,
        usuario.uuid,
        'ATUALIZACAO_PASSO5',
        'Repositório e privacidade configurados',
        dadosAnteriores,
        dados,
        usuario.ip,
        usuario.userAgent,
        client,
      );

      await this.projetosDao.registrarAuditoria(
        projetoUuid,
        usuario.uuid,
        'PUBLICACAO',
        'Projeto publicado e agora está visível',
        { status: 'RASCUNHO' },
        { status: 'PUBLICADO' },
        usuario.ip,
        usuario.userAgent,
        client,
      );

      await client.query('COMMIT');

      await this.notificacoesService.notificarAutores(
        projetoUuid,
        'PROJETO_PUBLICADO',
        'Projeto publicado',
        `O projeto "${projeto.titulo}" foi publicado.`,
      );
      await this.notificacoesService.notificarOrientadores(
        projetoUuid,
        'PROJETO_PUBLICADO',
        'Projeto publicado',
        `O projeto "${projeto.titulo}" foi publicado.`,
      );

      return {
        mensagem: 'Projeto publicado com sucesso! Agora ele está visível para todos.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Busca projeto completo por UUID
   */
  async buscarProjeto(uuid: string, usuario?: any): Promise<any> {
    const projeto = await this.projetosDao.buscarPorUuid(uuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verifica permissão para visualizar rascunhos
    if (projeto.status === 'RASCUNHO') {
      if (!usuario) {
        throw new ForbiddenException('Projeto não está publicado');
      }

      // Verifica se é autor, orientador ou admin
      let temPermissao = usuario.tipo === 'ADMIN';

      if (!temPermissao && usuario.tipo === 'ALUNO') {
        temPermissao = await this.projetosDao.verificarAutorProjeto(
          uuid,
          usuario.uuid,
        );
      }

      if (!temPermissao && usuario.tipo === 'PROFESSOR') {
        temPermissao = await this.projetosDao.verificarOrientadorProjeto(
          uuid,
          usuario.uuid,
        );
      }

      if (!temPermissao) {
        throw new ForbiddenException(
          'Você não tem permissão para visualizar este projeto',
        );
      }
    }

    // Busca dados relacionados
    const autores = await this.projetosDao.buscarAutores(uuid);
    const orientadores = await this.projetosDao.buscarOrientadores(uuid);
    const tecnologias = await this.projetosDao.buscarTecnologias(uuid);
    const fases = await this.projetosDao.buscarFases(uuid);

    // Censura emails se usuário não autenticado ou não é participante
    let autoresCensurados = autores;
    let orientadoresCensurados = orientadores;

    if (!usuario || usuario.tipo === 'VISITANTE') {
      autoresCensurados = autores.map((a) => ({
        ...a,
        email: censurarEmail(a.email),
      }));
      orientadoresCensurados = orientadores.map((o) => ({
        ...o,
        email: censurarEmail(o.email),
      }));
    }

    return {
      ...projeto,
      autores: autoresCensurados,
      orientadores: orientadoresCensurados,
      tecnologias,
      fases,
    };
  }

  /**
   * Lista projetos com filtros e paginação
   */
  async listarProjetos(filtros: any): Promise<{
    projetos: any[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  }> {
    return this.projetosDao.listarProjetos(filtros);
  }

  /**
   * Atualiza projeto
   */
  async atualizarProjeto(
    projetoUuid: string,
    dados: UpdateProjetoDto,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verifica permissão
    let temPermissao = usuario.tipo === 'ADMIN';

    if (!temPermissao) {
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
    }

    if (!temPermissao) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este projeto',
      );
    }

    // Verifica título duplicado
    if (dados.titulo) {
      const tituloExiste = await this.projetosDao.verificarTituloExistente(
        dados.titulo,
        projetoUuid,
      );

      if (tituloExiste) {
        throw new ConflictException('Já existe um projeto com este título');
      }
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Atualiza campos básicos
      await this.projetosDao.atualizarProjeto(projetoUuid, dados, client);

      await client.query('COMMIT');

      const labels = {
        titulo: 'Título',
        descricao: 'Descrição',
        repositorio_url: 'Repositório',
        itinerario: 'Itinerário',
        lab_maker: 'Lab Maker',
        participou_saga: 'Participou da Saga',
        categoria: 'Categoria',
        banner_url: 'Banner',
      } as any;
      const diff = formatarDiff(projeto, dados, Object.keys(dados || {}), labels);
      if (diff && diff.length > 0) {
        await this.notificacoesService.notificarAutores(
          projetoUuid,
          'PROJETO_ATUALIZADO',
          'Projeto atualizado',
          `O projeto "${projeto.titulo}" teve alterações:\n${diff}`,
        );
        await this.notificacoesService.notificarOrientadores(
          projetoUuid,
          'PROJETO_ATUALIZADO',
          'Projeto atualizado',
          `O projeto "${projeto.titulo}" teve alterações:\n${diff}`,
        );
      }

      return { mensagem: 'Projeto atualizado com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deleta projeto (soft delete)
   */
  async deletarProjeto(
    projetoUuid: string,
    usuario: any,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (projeto.status === 'PUBLICADO') {
      throw new ForbiddenException('Não é possível excluir um projeto publicado. Apenas rascunhos podem ser excluídos.');
    }

    // Apenas admin ou líder pode deletar
    let temPermissao = usuario.tipo === 'ADMIN';

    if (!temPermissao && usuario.tipo === 'ALUNO') {
      const alunoResult = await this.pool.query(
        'SELECT 1 FROM alunos WHERE usuario_uuid = $1',
        [usuario.uuid],
      );

      if (alunoResult.rows.length > 0) {
        const liderResult = await this.pool.query(
          'SELECT 1 FROM projetos_alunos WHERE projeto_uuid = $1 AND usuario_uuid = $2 AND papel = $3',
          [projetoUuid, alunoResult.rows[0].uuid, 'LIDER'],
        );
        temPermissao = liderResult.rows.length > 0;
      }
    }

    if (!temPermissao) {
      throw new ForbiddenException(
        'Apenas o líder do projeto ou administrador pode deletá-lo',
      );
    }

    await this.projetosDao.deletarProjeto(projetoUuid);

    return { mensagem: 'Projeto arquivado com sucesso' };
  }

  /**
   * Lista projetos do usuário logado (publicados e rascunhos)
   */
  async listarMeusProjetos(usuario: any): Promise<{ publicados: any[]; rascunhos: any[] }> {
    if (!usuario || !usuario.uuid) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    return this.projetosDao.listarMeusProjetos(usuario.uuid, usuario.tipo || 'ALUNO');
  }

  /**
   * Valida se alunos e professores existem no banco
   */
  async validarEquipe(dados: {
    alunos_uuids?: string[];
    professores_uuids?: string[];
  }): Promise<any> {
    const resultado: any = {
      alunos: { validos: [], invalidos: [], dados: [] },
      professores: { validos: [], invalidos: [], dados: [] },
    };

    // Valida alunos
    if (dados.alunos_uuids && dados.alunos_uuids.length > 0) {
      const validacaoAlunos = await this.projetosDao.validarAlunos(dados.alunos_uuids);
      resultado.alunos.validos = validacaoAlunos.validos;
      resultado.alunos.invalidos = validacaoAlunos.invalidos;

      // Busca informações completas dos alunos válidos
      if (validacaoAlunos.validos.length > 0) {
        resultado.alunos.dados = await this.projetosDao.buscarAlunosParaValidacao(
          validacaoAlunos.validos,
        );
      }
    }

    // Valida professores
    if (dados.professores_uuids && dados.professores_uuids.length > 0) {
      const validacaoProfessores = await this.projetosDao.validarProfessores(
        dados.professores_uuids,
      );
      resultado.professores.validos = validacaoProfessores.validos;
      resultado.professores.invalidos = validacaoProfessores.invalidos;

      // Busca informações completas dos professores válidos
      if (validacaoProfessores.validos.length > 0) {
        resultado.professores.dados = await this.projetosDao.buscarProfessoresParaValidacao(
          validacaoProfessores.validos,
        );
      }
    }

    return resultado;
  }

  /**
   * Busca histórico de auditoria de um projeto
   */
  async buscarAuditoria(projetoUuid: string, limite?: number): Promise<any[]> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return this.projetosDao.buscarAuditoriaProjeto(projetoUuid, limite);
  }

  /**
   * Resolve emails para UUIDs de alunos/professores
   */
  async resolverUsuariosPorEmail(emails: string[]): Promise<{
    alunos: { email: string; usuario_uuid: string; nome: string }[];
    professores: { email: string; usuario_uuid: string; nome: string }[];
    invalidos: string[];
  }> {
    if (!emails || emails.length === 0) {
      throw new BadRequestException('Informe pelo menos um email');
    }

    const { alunos, professores } = await this.projetosDao.resolverUsuariosPorEmail(emails);

    const encontrados = new Set<string>([...alunos, ...professores].map(u => u.email.toLowerCase()));
    const invalidos = emails
      .map(e => e.toLowerCase())
      .filter(email => !encontrados.has(email));

    return { alunos, professores, invalidos };
  }

  /**
   * Busca usuários por termo para autocomplete
   */
  async buscarUsuarios(termo: string) {
    if (!termo || termo.length < 3) {
      return [];
    }
    return this.projetosDao.buscarUsuarios(termo);
  }

  /**
   * Calcula a fase atual do projeto baseado no preenchimento
   */
  private calcularFaseAtual(dados: Passo4ProjetoDto): string {
    const hasContent = (fase: any) =>
      fase && fase.descricao && fase.descricao.trim().length >= 50 && fase.anexos && fase.anexos.length > 0;

    if (hasContent(dados.implementacao)) return 'IMPLEMENTACAO';
    if (hasContent(dados.prototipagem)) return 'IMPLEMENTACAO'; // Se já fez prototipagem, vai para implementação
    if (hasContent(dados.modelagem)) return 'PROTOTIPAGEM';
    if (hasContent(dados.ideacao)) return 'MODELAGEM';
    return 'IDEACAO';
  }

  async curtirProjeto(uuid: string): Promise<void> {
    await this.projetosDao.incrementarCurtidas(uuid);
  }

  async visualizarProjeto(uuid: string): Promise<void> {
    await this.projetosDao.incrementarVisualizacoes(uuid);
  }
}
