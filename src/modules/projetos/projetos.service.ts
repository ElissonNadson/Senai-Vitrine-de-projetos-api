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

@Injectable()
export class ProjetosService {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    private readonly projetosDao: ProjetosDao,
  ) {}

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
      const alunoResult = await client.query(
        'SELECT uuid FROM alunos WHERE usuario_uuid = $1',
        [usuario.uuid],
      );

      if (alunoResult.rows.length === 0) {
        throw new NotFoundException('Perfil de aluno não encontrado');
      }

      const alunoUuid = alunoResult.rows[0].uuid;

      // Cria rascunho (passa usuario.uuid para as FKs criado_por_uuid e lider_uuid)
      const projetoUuid = await this.projetosDao.criarRascunho(
        dados,
        usuario.uuid,
        client,
      );

      // Adiciona criador como líder automaticamente
      await this.projetosDao.adicionarAutores(
        projetoUuid,
        [{ aluno_uuid: alunoUuid, papel: 'LIDER' }],
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
          lider_uuid: alunoUuid,
        },
        usuario.ip,
        usuario.userAgent,
        client,
      );

      await client.query('COMMIT');

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
      'SELECT uuid FROM alunos WHERE usuario_uuid = $1',
      [usuario.uuid],
    );

    if (alunoResult.rows.length === 0) {
      throw new ForbiddenException('Apenas alunos podem editar este projeto');
    }

    const alunoUuid = alunoResult.rows[0].uuid;
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
      'SELECT uuid FROM alunos WHERE usuario_uuid = $1',
      [usuario.uuid],
    );

    if (alunoResult.rows.length === 0) {
      throw new ForbiddenException('Apenas alunos podem editar este projeto');
    }

    const alunoUuid = alunoResult.rows[0].uuid;
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
    const alunosUuids = dados.autores.map(a => a.aluno_uuid);
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
          autores: autoresAnteriores.map(a => ({ uuid: a.aluno_uuid, papel: a.papel })),
          orientadores: orientadoresAnteriores.map(o => o.professor_uuid),
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
      'SELECT uuid FROM alunos WHERE usuario_uuid = $1',
      [usuario.uuid],
    );

    if (alunoResult.rows.length === 0) {
      throw new ForbiddenException('Apenas alunos podem editar este projeto');
    }

    const alunoUuid = alunoResult.rows[0].uuid;
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

      await client.query('COMMIT');

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
      'SELECT uuid FROM alunos WHERE usuario_uuid = $1',
      [usuario.uuid],
    );

    if (alunoResult.rows.length === 0) {
      throw new ForbiddenException('Apenas alunos podem editar este projeto');
    }

    const alunoUuid = alunoResult.rows[0].uuid;
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
        tipo_repositorio: projeto.tipo_repositorio,
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
        const alunoResult = await this.pool.query(
          'SELECT uuid FROM alunos WHERE usuario_uuid = $1',
          [usuario.uuid],
        );
        if (alunoResult.rows.length > 0) {
          temPermissao = await this.projetosDao.verificarAutorProjeto(
            uuid,
            alunoResult.rows[0].uuid,
          );
        }
      }

      if (!temPermissao && usuario.tipo === 'PROFESSOR') {
        const professorResult = await this.pool.query(
          'SELECT uuid FROM professores WHERE usuario_uuid = $1',
          [usuario.uuid],
        );
        if (professorResult.rows.length > 0) {
          temPermissao = await this.projetosDao.verificarOrientadorProjeto(
            uuid,
            professorResult.rows[0].uuid,
          );
        }
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
        const alunoResult = await this.pool.query(
          'SELECT uuid FROM alunos WHERE usuario_uuid = $1',
          [usuario.uuid],
        );
        if (alunoResult.rows.length > 0) {
          temPermissao = await this.projetosDao.verificarAutorProjeto(
            projetoUuid,
            alunoResult.rows[0].uuid,
          );
        }
      } else if (usuario.tipo === 'PROFESSOR') {
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

      // Atualiza tecnologias se fornecidas
      if (dados.tecnologias_uuids) {
        await this.projetosDao.removerTecnologias(projetoUuid, client);
        await this.projetosDao.adicionarTecnologias(
          projetoUuid,
          dados.tecnologias_uuids,
          client,
        );
      }

      await client.query('COMMIT');

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

    // Apenas admin ou líder pode deletar
    let temPermissao = usuario.tipo === 'ADMIN';

    if (!temPermissao && usuario.tipo === 'ALUNO') {
      const alunoResult = await this.pool.query(
        'SELECT uuid FROM alunos WHERE usuario_uuid = $1',
        [usuario.uuid],
      );

      if (alunoResult.rows.length > 0) {
        const liderResult = await this.pool.query(
          'SELECT 1 FROM projetos_alunos WHERE projeto_uuid = $1 AND aluno_uuid = $2 AND papel = $3',
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
    alunos: { email: string; usuario_uuid: string; aluno_uuid: string; nome: string }[];
    professores: { email: string; usuario_uuid: string; professor_uuid: string; nome: string }[];
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
}
