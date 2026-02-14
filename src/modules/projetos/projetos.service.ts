import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
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
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { formatarDiff, diffLista } from '../../common/utils/diff.util';
import {
  salvarArquivoLocal,
  validarArquivoCompleto,
} from '../../common/utils/file-upload.util';

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
    usuario: JwtPayload,
  ): Promise<{ uuid: string; mensagem: string }> {
    // Valida que usuário é aluno, docente ou admin
    if (
      usuario.tipo !== 'ALUNO' &&
      usuario.tipo !== 'DOCENTE' &&
      usuario.tipo !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Apenas alunos, docentes e administradores podem criar projetos',
      );
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

      // Se for aluno, ele é o líder. Se for docente, líder é NULL inicialmente.
      const liderUuid = usuario.tipo === 'ALUNO' ? usuario.uuid : null;

      // Cria rascunho
      const projetoUuid = await this.projetosDao.criarRascunho(
        dados,
        usuario.uuid,
        liderUuid,
        client,
      );

      // Associar criador ao projeto
      if (usuario.tipo === 'ALUNO') {
        await this.projetosDao.adicionarAutores(
          projetoUuid,
          [{ usuario_uuid: usuario.uuid, papel: 'LIDER' }],
          client,
        );
      } else {
        // Docente entra como Orientador
        await this.projetosDao.adicionarOrientadores(
          projetoUuid,
          [usuario.uuid],
          client,
        );
      }

      // Registra auditoria
      await this.projetosDao.registrarAuditoria(
        projetoUuid,
        usuario.uuid,
        'CRIACAO',
        `Projeto criado pelo ${usuario.tipo.toLowerCase()}`,
        null,
        {
          titulo: dados.titulo,
          descricao: dados.descricao,
          categoria: dados.categoria,
          lider_uuid: liderUuid,
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
        { projetoTitulo: dados.titulo },
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
    usuario: JwtPayload,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (!(await this.podeEditarProjeto(usuario, projetoUuid))) {
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
        mensagem:
          'Informações acadêmicas atualizadas. Prossiga para o Passo 3.',
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
    usuario: JwtPayload,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verificação de permissão unificada
    if (!(await this.podeEditarProjeto(usuario, projetoUuid))) {
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
    const alunosUuids = dados.autores.map((a) => a.usuario_uuid);
    const validacaoAlunos = await this.projetosDao.validarAlunos(alunosUuids);

    if (validacaoAlunos.invalidos.length > 0) {
      throw new BadRequestException(
        `Os seguintes alunos não foram encontrados: ${validacaoAlunos.invalidos.join(', ')}`,
      );
    }

    // Valida se todos os docentes existem
    const validacaoDocentes = await this.projetosDao.validarDocentes(
      dados.docentes_uuids,
    );

    if (validacaoDocentes.invalidos.length > 0) {
      throw new BadRequestException(
        `Os seguintes docentes não foram encontrados: ${validacaoDocentes.invalidos.join(', ')}`,
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Se houve mudança de líder ou se líder era null, atualizamos a tabela projetos
      const novaLiderUuid = lideres[0].usuario_uuid;
      if (projeto.lider_uuid !== novaLiderUuid) {
        await client.query(
          'UPDATE projetos SET lider_uuid = $1 WHERE uuid = $2',
          [novaLiderUuid, projetoUuid],
        );
      }

      // Captura equipe anterior para auditoria
      const autoresAnteriores =
        await this.projetosDao.buscarAutores(projetoUuid);
      const orientadoresAnteriores =
        await this.projetosDao.buscarOrientadores(projetoUuid);

      // Remove autores atuais (mantém delete físico para alunos)
      await client.query(
        'DELETE FROM projetos_alunos WHERE projeto_uuid = $1',
        [projetoUuid],
      );

      // Garante que o criador docente não se remova da lista de orientadores
      const docentesUuids = [...dados.docentes_uuids];
      if (projeto.criado_por_uuid) {
        const criadorResult = await client.query(
          'SELECT tipo FROM usuarios WHERE uuid = $1',
          [projeto.criado_por_uuid],
        );
        if (
          criadorResult.rows[0]?.tipo === 'DOCENTE' &&
          !docentesUuids.includes(projeto.criado_por_uuid)
        ) {
          docentesUuids.push(projeto.criado_por_uuid);
        }
      }

      // Lógica de Orientadores com Histórico (Soft Delete)
      // 1. Busca orientadores ativos atuais
      // A função buscarOrientadores agora retorna apenas ativos (ajustado no DAO)
      // Mas precisamos usar o client da transação
      // Como buscarOrientadores usa this.pool, melhor fazer a query direta aqui ou confiar que a leitura fora da transação é ok?
      // Melhor fazer query rápida para pegar IDs dos ativos
      const orientadoresAtivosResult = await client.query(
        `SELECT usuario_uuid FROM projetos_docentes WHERE projeto_uuid = $1 AND (ativo = true OR ativo IS NULL)`,
        [projetoUuid]
      );
      const orientadoresAtivosUuids = orientadoresAtivosResult.rows.map(r => r.usuario_uuid);

      // 2. Desativa quem não está mais na lista nova
      // A lista 'docentesUuids' contém a nova equipe desejada
      await this.projetosDao.desativarOrientadores(projetoUuid, docentesUuids, client);

      // 3. Adiciona autores (alunos)
      await this.projetosDao.adicionarAutores(
        projetoUuid,
        dados.autores,
        client,
      );

      // 4. Filtra novos orientadores para inserir (apenas quem não estava ativo)
      const novosOrientadoresParaInserir = docentesUuids.filter(uuid => !orientadoresAtivosUuids.includes(uuid));

      // 5. Adiciona novos orientadores
      if (novosOrientadoresParaInserir.length > 0) {
        await this.projetosDao.adicionarOrientadores(
          projetoUuid,
          novosOrientadoresParaInserir,
          client,
        );
      }

      // Registra auditoria
      await this.projetosDao.registrarAuditoria(
        projetoUuid,
        usuario.uuid,
        'ATUALIZACAO_PASSO3',
        'Equipe (autores e orientadores) atualizada',
        {
          autores: autoresAnteriores.map((a) => ({
            uuid: a.usuario_uuid,
            papel: a.papel,
          })),
          orientadores: orientadoresAnteriores.map((o) => o.usuario_uuid),
        },
        {
          autores: dados.autores,
          orientadores: dados.docentes_uuids,
        },
        usuario.ip,
        usuario.userAgent,
        client,
      );

      await client.query('COMMIT');

      const antigosAutoresUuids = autoresAnteriores.map((a) =>
        String(a.usuario_uuid),
      );
      const novosAutoresUuids = (dados.autores || []).map((a) =>
        String(a.usuario_uuid),
      );
      const autoresDiff = diffLista(antigosAutoresUuids, novosAutoresUuids);
      for (const uuid of autoresDiff.adicionados) {
        await this.notificacoesService.criarNotificacao(
          uuid,
          'VINCULO_ADICIONADO',
          'Você foi adicionado ao projeto',
          `Você foi adicionado ao projeto "${projeto.titulo}"`,
          `/projetos/${projetoUuid}`,
          { projetoTitulo: projeto.titulo, papel: 'integrante' },
        );
      }
      // Notificar membros removidos
      if (autoresDiff.removidos.length > 0) {
        await this.notificacoesService.notificarMembrosRemovidos(
          autoresDiff.removidos,
          projeto.titulo,
          projetoUuid,
        );
      }

      const antigosOrientadoresUuids = orientadoresAnteriores.map((o) =>
        String(o.usuario_uuid),
      );
      const novosOrientadoresUuids = (dados.docentes_uuids || []).map(String);
      const orientadoresDiff = diffLista(
        antigosOrientadoresUuids,
        novosOrientadoresUuids,
      );
      for (const uuid of orientadoresDiff.adicionados) {
        await this.notificacoesService.criarNotificacao(
          uuid,
          'VINCULO_ADICIONADO',
          'Você foi adicionado ao projeto',
          `Você foi adicionado como orientador no projeto "${projeto.titulo}"`,
          `/projetos/${projetoUuid}`,
          { projetoTitulo: projeto.titulo, papel: 'orientador' },
        );
      }
      // Notificar orientadores removidos
      if (orientadoresDiff.removidos.length > 0) {
        await this.notificacoesService.notificarMembrosRemovidos(
          orientadoresDiff.removidos,
          projeto.titulo,
          projetoUuid,
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
    arquivos: Express.Multer.File[],
    usuario: JwtPayload,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (!(await this.podeEditarProjeto(usuario, projetoUuid))) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este projeto',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Captura fases anteriores para auditoria
      const fasesAnteriores =
        await this.projetosDao.buscarFasesProjeto(projetoUuid);

      // Mapear arquivos recebidos por fieldname
      const arquivosPorCampo = new Map<string, Express.Multer.File>();
      if (arquivos && arquivos.length > 0) {
        for (const arquivo of arquivos) {
          arquivosPorCampo.set(arquivo.fieldname, arquivo);
        }
      }

      // Salvar cada fase - SEMPRE salvar todas as 4 fases, mesmo sem dados
      const fases = [
        { nome: 'ideacao', dados: dados.ideacao, ordem: 1 },
        { nome: 'modelagem', dados: dados.modelagem, ordem: 2 },
        { nome: 'prototipagem', dados: dados.prototipagem, ordem: 3 },
        { nome: 'implementacao', dados: dados.implementacao, ordem: 4 },
      ];

      for (const fase of fases) {
        // Sempre salvar a fase, mesmo que não tenha dados
        // Se não tiver dados, será salva com descrição vazia e status "Pendente"
        const descricao = fase.dados?.descricao || '';
        const faseUuid = await this.projetosDao.salvarFaseProjeto(
          projetoUuid,
          fase.nome,
          descricao,
          fase.ordem,
          client,
        );

        // Processar anexos enviados no payload (podem ser URLs já existentes ou novos)
        if (fase.dados?.anexos && fase.dados.anexos.length > 0) {
          for (const anexo of fase.dados.anexos) {
            // Verificar se há arquivo físico para este anexo
            const fieldname = `${fase.nome}_${anexo.tipo}`;
            const arquivo = arquivosPorCampo.get(fieldname);

            if (arquivo) {
              // Validar arquivo
              await validarArquivoCompleto(arquivo, 'ANEXO_GERAL');

              // Salvar arquivo no disco
              const caminhoRelativo = await salvarArquivoLocal(
                arquivo,
                `projetos/${fase.nome}`,
              );

              // Atualizar anexo com URL do arquivo salvo
              anexo.url_arquivo = caminhoRelativo;
              anexo.nome_arquivo = arquivo.originalname;
              anexo.tamanho_bytes = arquivo.size;
              anexo.mime_type = arquivo.mimetype;
            }

            // Salvar ou atualizar anexo no banco (UPSERT)
            // Isso vai sobrescrever apenas o anexo específico pelo tipo
            await this.projetosDao.salvarAnexoFase(faseUuid, anexo, client);
          }
        }
      }

      // Recalcular status de todas as fases após salvar todos os anexos
      // Isso garante que o status esteja correto mesmo quando várias fases são salvas na mesma criação
      // Recalcular TODAS as fases (mesmo as que não tinham dados)
      for (const fase of fases) {
        // Buscar UUID da fase salva
        const faseResult = await client.query(
          `SELECT uuid FROM projetos_fases WHERE projeto_uuid = $1 AND nome_fase = $2`,
          [projetoUuid, fase.nome],
        );

        if (faseResult.rows.length > 0) {
          const faseUuid = faseResult.rows[0].uuid;
          // Recalcular status considerando descrição e anexos já salvos
          // Se não tiver descrição nem anexos, o status será "Pendente"
          await this.projetosDao.recalcularStatusFase(faseUuid, client);
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

      // Calcular e atualizar fase atual usando nova lógica progressiva
      // Agora todos os status estão recalculados corretamente
      const novaFase = await this.calcularFaseAtualPorStatus(
        projetoUuid,
        client,
      );
      await this.projetosDao.atualizarFaseAtual(projetoUuid, novaFase, client);

      await client.query('COMMIT');

      const fasesAlteradas: string[] = [];
      if (dados.ideacao) fasesAlteradas.push('Ideação');
      if (dados.modelagem) fasesAlteradas.push('Modelagem');
      if (dados.prototipagem) fasesAlteradas.push('Prototipagem');
      if (dados.implementacao) fasesAlteradas.push('Implementação');
      const resumo =
        fasesAlteradas.length > 0
          ? `Fases alteradas: ${fasesAlteradas.join(', ')}`
          : '';
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
        mensagem:
          'Fases do projeto salvas com sucesso. Prossiga para o Passo 5.',
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
    usuario: JwtPayload,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verificação de permissão unificada
    if (!(await this.podeEditarProjeto(usuario, projetoUuid))) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este projeto',
      );
    }

    // VALIDAR SE TEM LÍDER DEFINIDO ANTES DE PUBLICAR
    if (!projeto.lider_uuid && usuario.tipo !== 'ADMIN') {
      throw new BadRequestException(
        'Para publicar o projeto, é obrigatório definir um Aluno Líder na etapa 3 "Equipe".',
      );
    }

    // Valida que termos foram aceitos
    if (!dados.aceitou_termos) {
      throw new BadRequestException(
        'Você deve aceitar os termos de uso para publicar o projeto',
      );
    }

    // VALIDAR PRIMEIRA FASE (IDEAÇÃO) - OBRIGATÓRIA PARA PUBLICAÇÃO
    const fases = await this.projetosDao.buscarFases(projetoUuid);
    const ideacao = fases['ideacao'] || fases['Ideação'] || fases['IDEAÇÃO'];
    const mensagem =
      'Para publicar o projeto, é obrigatório preencher a fase de Ideação com descrição e pelo menos um anexo.';

    if (!ideacao) {
      throw new BadRequestException(mensagem);
    }

    const temDescricao =
      ideacao.descricao && ideacao.descricao.trim().length > 0;
    const temAnexo = ideacao.anexos && ideacao.anexos.length > 0;

    if (!temDescricao || !temAnexo) {
      throw new BadRequestException(mensagem);
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
        mensagem:
          'Projeto publicado com sucesso! Agora ele está visível para todos.',
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
  /**
   * Busca dados mínimos do projeto para Open Graph meta tags
   */
  async buscarDadosOG(uuid: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT titulo, descricao, banner_url
       FROM projetos
       WHERE uuid = $1 AND status = 'PUBLICADO'`,
      [uuid],
    );
    return result.rows[0] || null;
  }

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
      } else if (!temPermissao && usuario.tipo === 'DOCENTE') {
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

    // Busca dados complementares
    projeto.autores = await this.projetosDao.buscarAutores(uuid);
    projeto.orientadores = await this.projetosDao.buscarOrientadores(uuid);
    projeto.historico_orientadores = await this.projetosDao.buscarHistoricoOrientadores(uuid);
    projeto.tecnologias = await this.projetosDao.buscarTecnologias(uuid);
    projeto.fases = await this.projetosDao.buscarFases(uuid);

    // Censura emails se usuário não autenticado ou não é participante
    let autoresCensurados = projeto.autores;
    let orientadoresCensurados = projeto.orientadores;

    if (!usuario || usuario.tipo === 'VISITANTE') {
      autoresCensurados = projeto.autores.map((a) => ({
        ...a,
        email: censurarEmail(a.email),
      }));
      orientadoresCensurados = projeto.orientadores.map((o) => ({
        ...o,
        email: censurarEmail(o.email),
      }));
    }

    // Verifica se deve proteger URLs de anexos privados
    let fasesFiltradas = projeto.fases;
    if (projeto.anexos_visibilidade === 'Privado') {
      // Verifica se o usuário tem permissão para ver os anexos
      let temPermissaoAnexos = false;

      if (usuario) {
        if (usuario.tipo === 'ADMIN') {
          temPermissaoAnexos = true;
        } else if (usuario.tipo === 'ALUNO') {
          temPermissaoAnexos = await this.projetosDao.verificarAutorProjeto(
            uuid,
            usuario.uuid,
          );
        } else if (usuario.tipo === 'DOCENTE') {
          temPermissaoAnexos =
            await this.projetosDao.verificarOrientadorProjeto(
              uuid,
              usuario.uuid,
            );
        }
      }

      // Para anexos privados, sempre modifica as URLs
      fasesFiltradas = Object.keys(projeto.fases).reduce((acc, faseName) => {
        const fase = projeto.fases[faseName];
        if (fase && fase.anexos) {
          acc[faseName] = {
            ...fase,
            // @ts-ignore
            anexos: fase.anexos.map((anexo) => {
              if (!temPermissaoAnexos) {
                // Sem permissão: remove a URL completamente
                return {
                  ...anexo,
                  url_arquivo: undefined,
                };
              } else {
                // Com permissão: troca para endpoint protegido
                const urlOriginal = anexo.url_arquivo || '';
                const match = urlOriginal.match(/\/uploads\/projetos\/(.*)/);
                if (match) {
                  return {
                    ...anexo,
                    url_arquivo: `/api/projetos/${uuid}/anexo/${match[1]}`,
                  };
                }
                return anexo;
              }
            }),
          };
        } else {
          acc[faseName] = fase;
        }
        return acc;
      }, {});
    }

    return {
      ...projeto,
      autores: autoresCensurados,
      orientadores: orientadoresCensurados,
      tecnologias: projeto.tecnologias,
      fases: fasesFiltradas,
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
    usuario: JwtPayload,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Verifica permissão
    if (!(await this.podeEditarProjeto(usuario, projetoUuid))) {
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
      const dadosAnteriores = {
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        categoria: projeto.categoria,
        repositorio_url: projeto.repositorio_url,
        itinerario: projeto.itinerario,
        senai_lab: projeto.senai_lab,
        saga_senai: projeto.saga_senai,
        banner_url: projeto.banner_url,
        curso: projeto.curso,
        turma: projeto.turma,
        modalidade: projeto.modalidade,
        unidade_curricular: projeto.unidade_curricular,
      };
      await this.projetosDao.atualizarProjeto(projetoUuid, dados, client);

      await client.query('COMMIT');

      await this.projetosDao.registrarAuditoria(
        projetoUuid,
        usuario.uuid,
        'UPLOAD_ANEXO_FASE',
        'Dados do projeto atualizados',
        dadosAnteriores,
        dados,
        usuario.ip,
        usuario.userAgent,
        client,
      );

      const labels = {
        titulo: 'Título',
        descricao: 'Descrição',
        repositorio_url: 'Repositório',
        itinerario: 'Itinerário',
        senai_lab: 'SENAI Lab',
        saga_senai: 'Participação na Saga SENAI',
        categoria: 'Categoria',
        banner_url: 'Banner',
        participou_edital: 'Participação em edital',
        ganhou_premio: 'Premiação',
        link_repositorio: 'Link do repositório',
        has_repositorio: 'Repositório',
        codigo_visibilidade: 'Visibilidade do código',
        anexos_visibilidade: 'Visibilidade dos anexos',
        aceitou_termos: 'Termos de uso',
        status: 'Status',
      } as any;
      const diff = formatarDiff(
        projeto,
        dados,
        Object.keys(dados || {}),
        labels,
      );
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
    usuario: JwtPayload,
  ): Promise<{ mensagem: string }> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);

    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Alunos não podem excluir projetos publicados — devem solicitar ao orientador
    if (usuario.tipo === 'ALUNO' && projeto.status === 'PUBLICADO') {
      throw new ForbiddenException(
        'Alunos não podem excluir projetos publicados. Solicite a desativação ao orientador.',
      );
    }

    // Permissão: ADMIN, líder (ALUNO), orientador (DOCENTE) ou criador
    let temPermissao = usuario.tipo === 'ADMIN';

    if (!temPermissao && usuario.tipo === 'ALUNO') {
      const liderResult = await this.pool.query(
        'SELECT 1 FROM projetos_alunos WHERE projeto_uuid = $1 AND usuario_uuid = $2 AND papel = $3',
        [projetoUuid, usuario.uuid, 'LIDER'],
      );
      temPermissao = liderResult.rows.length > 0;
    }

    if (!temPermissao && usuario.tipo === 'DOCENTE') {
      temPermissao = await this.projetosDao.verificarOrientadorProjeto(
        projetoUuid,
        usuario.uuid,
      );
    }

    if (!temPermissao) {
      temPermissao = projeto.criado_por_uuid === usuario.uuid;
    }

    if (!temPermissao) {
      throw new ForbiddenException(
        'Apenas o líder do projeto ou administrador pode deletá-lo',
      );
    }

    await this.projetosDao.deletarProjeto(projetoUuid);

    // Notificar autores e orientadores sobre o arquivamento
    await this.notificacoesService.notificarProjetoArquivado(
      projetoUuid,
      projeto.titulo,
    );

    return { mensagem: 'Projeto arquivado com sucesso' };
  }

  /**
   * Verifica se o usuário tem permissão para acessar anexos de um projeto
   * Para projetos com anexos públicos, qualquer um pode acessar
   * Para projetos com anexos privados, apenas membros da equipe
   */
  async verificarPermissaoAnexo(projetoUuid: string, usuario?: any): Promise<void> {
    const projeto = await this.projetosDao.buscarPorUuid(projetoUuid);
    if (!projeto) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Se anexos são públicos, permitir acesso
    if (projeto.anexos_visibilidade !== 'Privado') {
      return;
    }

    // Se privado, verificar permissão
    if (!usuario) {
      throw new ForbiddenException('Anexos privados requerem autenticação');
    }

    if (usuario.tipo === 'ADMIN') return;

    if (usuario.tipo === 'ALUNO') {
      const isAutor = await this.projetosDao.verificarAutorProjeto(projetoUuid, usuario.uuid);
      if (isAutor) return;
    }

    if (usuario.tipo === 'DOCENTE' || usuario.tipo === 'PROFESSOR') {
      const isOrientador = await this.projetosDao.verificarOrientadorProjeto(projetoUuid, usuario.uuid);
      if (isOrientador) return;
    }

    throw new ForbiddenException('Sem permissão para acessar os anexos deste projeto');
  }

  /**
   * Remove um anexo individual de uma fase do projeto
   */
  async removerAnexoFase(
    projetoUuid: string,
    anexoUuid: string,
    usuario: JwtPayload,
  ): Promise<{ mensagem: string }> {
    const anexo = await this.projetosDao.buscarAnexoFaseComProjeto(anexoUuid);

    if (!anexo) {
      throw new NotFoundException('Anexo não encontrado');
    }

    if (anexo.projeto_uuid !== projetoUuid) {
      throw new ForbiddenException('Anexo não pertence a este projeto');
    }

    // Permissão: ADMIN, líder (ALUNO), orientador (DOCENTE) ou criador
    let temPermissao = usuario.tipo === 'ADMIN';

    if (!temPermissao && usuario.tipo === 'ALUNO') {
      const liderResult = await this.pool.query(
        'SELECT 1 FROM projetos_alunos WHERE projeto_uuid = $1 AND usuario_uuid = $2 AND papel = $3',
        [projetoUuid, usuario.uuid, 'LIDER'],
      );
      temPermissao = liderResult.rows.length > 0;
    }

    if (!temPermissao && usuario.tipo === 'DOCENTE') {
      temPermissao = await this.projetosDao.verificarOrientadorProjeto(
        projetoUuid,
        usuario.uuid,
      );
    }

    if (!temPermissao) {
      temPermissao = anexo.criado_por_uuid === usuario.uuid;
    }

    if (!temPermissao) {
      throw new ForbiddenException('Sem permissão para remover este anexo');
    }

    await this.projetosDao.removerAnexoFaseIndividual(anexoUuid);

    return { mensagem: 'Anexo removido com sucesso' };
  }

  /**
   * Lista projetos do usuário logado (publicados e rascunhos)
   */
  async listarMeusProjetos(
    usuario: JwtPayload,
  ): Promise<{ publicados: any[]; rascunhos: any[] }> {
    if (!usuario || !usuario.uuid) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    return this.projetosDao.listarMeusProjetos(
      usuario.uuid,
      usuario.tipo || 'ALUNO',
    );
  }

  /**
   * Valida se alunos e docentes existem no banco
   */
  async validarParticipantes(dados: {
    alunos_uuids?: string[];
    docentes_uuids?: string[];
  }): Promise<any> {
    const resultado: any = {
      alunos: { validos: [], invalidos: [], dados: [] },
      docentes: { validos: [], invalidos: [], dados: [] },
    };

    // Valida alunos
    if (dados.alunos_uuids && dados.alunos_uuids.length > 0) {
      const validacaoAlunos = await this.projetosDao.validarAlunos(
        dados.alunos_uuids,
      );
      resultado.alunos.validos = validacaoAlunos.validos;
      resultado.alunos.invalidos = validacaoAlunos.invalidos;

      // Busca informações completas dos alunos válidos
      if (validacaoAlunos.validos.length > 0) {
        resultado.alunos.dados =
          await this.projetosDao.buscarAlunosParaValidacao(
            validacaoAlunos.validos,
          );
      }
    }

    // Valida docentes
    if (dados.docentes_uuids && dados.docentes_uuids.length > 0) {
      const validacaoDocentes = await this.projetosDao.validarDocentes(
        dados.docentes_uuids,
      );
      resultado.docentes.validos = validacaoDocentes.validos;
      resultado.docentes.invalidos = validacaoDocentes.invalidos;

      // Busca informações completas dos docentes válidos
      if (validacaoDocentes.validos.length > 0) {
        resultado.docentes.dados =
          await this.projetosDao.buscarDocentesParaValidacao(
            validacaoDocentes.validos,
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
  /**
   * Resolve emails para UUIDs de alunos/docentes
   */
  async resolverUsuariosPorEmail(emails: string[]): Promise<{
    alunos: { email: string; usuario_uuid: string; nome: string }[];
    docentes: { email: string; usuario_uuid: string; nome: string }[];
    invalidos: string[];
  }> {
    if (!emails || emails.length === 0) {
      throw new BadRequestException('Informe pelo menos um email');
    }

    const { alunos, docentes } =
      await this.projetosDao.resolverUsuariosPorEmail(emails);

    const encontrados = new Set<string>(
      [...alunos, ...docentes].map((u) => u.email.toLowerCase()),
    );
    const invalidos = emails
      .map((e) => e.toLowerCase())
      .filter((email) => !encontrados.has(email));

    return { alunos, docentes, invalidos };
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
   * Calcula a fase atual do projeto baseado no status das fases (lógica progressiva)
   */
  private async calcularFaseAtualPorStatus(
    projetoUuid: string,
    client?: PoolClient,
  ): Promise<string> {
    // Buscar todas as fases do projeto com seus status diretamente do banco
    const db = client || this.pool;
    const fasesResult = await db.query(
      `SELECT 
        pf.uuid,
        pf.nome_fase,
        pf.descricao,
        pf.ordem,
        pf.status
       FROM projetos_fases pf
       WHERE pf.projeto_uuid = $1
       ORDER BY pf.ordem`,
      [projetoUuid],
    );

    const fases = fasesResult.rows;

    // Mapear fases por nome para facilitar acesso
    const fasesMap: Record<string, any> = {};
    for (const fase of fases) {
      fasesMap[fase.nome_fase] = fase;
    }

    const ideacao = fasesMap['ideacao'];
    const modelagem = fasesMap['modelagem'];
    const prototipagem = fasesMap['prototipagem'];
    const implementacao = fasesMap['implementacao'];

    // Verificar de trás para frente (Implementação → Prototipagem → Modelagem → Ideação)
    // Implementação: só pode ser fase_atual se estiver (em andamento OU concluída) E todas anteriores concluídas
    if (
      implementacao &&
      (implementacao.status === 'Em andamento' ||
        implementacao.status === 'Concluído') &&
      ideacao?.status === 'Concluído' &&
      modelagem?.status === 'Concluído' &&
      prototipagem?.status === 'Concluído'
    ) {
      return 'IMPLEMENTACAO';
    }

    // Prototipagem: só pode ser fase_atual se estiver (em andamento OU concluída) E Ideação e Modelagem concluídas
    if (
      prototipagem &&
      (prototipagem.status === 'Em andamento' ||
        prototipagem.status === 'Concluído') &&
      ideacao?.status === 'Concluído' &&
      modelagem?.status === 'Concluído'
    ) {
      return 'PROTOTIPAGEM';
    }

    // Modelagem: só pode ser fase_atual se estiver (em andamento OU concluída) E Ideação concluída
    if (
      modelagem &&
      (modelagem.status === 'Em andamento' ||
        modelagem.status === 'Concluído') &&
      ideacao?.status === 'Concluído'
    ) {
      return 'MODELAGEM';
    }

    // Ideação: pode ser fase_atual em qualquer status (pendente, em andamento ou concluída)
    if (ideacao) {
      return 'IDEACAO';
    }

    // Caso contrário: fase_atual = 'IDEACAO'
    return 'IDEACAO';
  }

  async curtirProjeto(uuid: string): Promise<void> {
    await this.projetosDao.incrementarCurtidas(uuid);
  }

  async visualizarProjeto(uuid: string): Promise<void> {
    await this.projetosDao.incrementarVisualizacoes(uuid);
  }

  async podeEditarProjeto(
    usuario: JwtPayload,
    projetoUuid: string,
  ): Promise<boolean> {
    if (usuario.tipo === 'ADMIN') return true;

    const regras = {
      ALUNO: () =>
        this.projetosDao.verificarAutorProjeto(projetoUuid, usuario.uuid),
      DOCENTE: () =>
        this.projetosDao.verificarOrientadorProjeto(projetoUuid, usuario.uuid),
    };

    return regras[usuario.tipo]?.() ?? false;
  }

  /**
   * Busca apenas as informações básicas do projeto (para verificação de anexo)
   */
  async buscarProjetoParaAnexo(
    uuid: string,
  ): Promise<{ anexos_visibilidade: string } | null> {
    const projeto = await this.projetosDao.buscarPorUuid(uuid);
    if (!projeto) return null;
    return { anexos_visibilidade: projeto.anexos_visibilidade };
  }

  /**
   * Verifica se usuário é autor do projeto
   */
  async verificarAutorProjeto(
    projetoUuid: string,
    usuarioUuid: string,
  ): Promise<boolean> {
    return this.projetosDao.verificarAutorProjeto(projetoUuid, usuarioUuid);
  }

  /**
   * Verifica se usuário é orientador do projeto
   */
  async verificarOrientadorProjeto(
    projetoUuid: string,
    usuarioUuid: string,
  ): Promise<boolean> {
    return this.projetosDao.verificarOrientadorProjeto(
      projetoUuid,
      usuarioUuid,
    );
  }
}
