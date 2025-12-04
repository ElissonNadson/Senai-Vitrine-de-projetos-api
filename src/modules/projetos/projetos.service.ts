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
   * Passo 2: Adicionar autores
   */
  async adicionarAutoresPasso2(
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
      throw new ForbiddenException('Apenas alunos podem adicionar autores');
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

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Remove autores atuais (exceto o criador que já foi adicionado no Passo 1)
      await client.query(
        'DELETE FROM projetos_alunos WHERE projeto_uuid = $1',
        [projetoUuid],
      );

      // Adiciona novos autores
      await this.projetosDao.adicionarAutores(projetoUuid, dados.autores, client);

      await client.query('COMMIT');

      return {
        mensagem: 'Autores adicionados com sucesso. Prossiga para o Passo 3.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Passo 3: Adicionar orientadores e tecnologias
   */
  async adicionarOrientadoresPasso3(
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
      throw new ForbiddenException(
        'Apenas alunos podem adicionar orientadores',
      );
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

      // Remove orientadores e tecnologias atuais
      await client.query(
        'DELETE FROM projetos_professores WHERE projeto_uuid = $1',
        [projetoUuid],
      );
      await this.projetosDao.removerTecnologias(projetoUuid, client);

      // Adiciona orientadores
      await this.projetosDao.adicionarOrientadores(
        projetoUuid,
        dados.orientadores_uuids,
        client,
      );

      // Adiciona tecnologias
      await this.projetosDao.adicionarTecnologias(
        projetoUuid,
        dados.tecnologias_uuids,
        client,
      );

      // Atualiza objetivos e resultados esperados
      await this.projetosDao.atualizarPasso3(projetoUuid, dados, client);

      await client.query('COMMIT');

      return {
        mensagem:
          'Orientadores e tecnologias adicionados. Prossiga para o Passo 4.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Passo 4: Publicar projeto com banner
   */
  async publicarProjetoPasso4(
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
      throw new ForbiddenException('Apenas alunos podem publicar projetos');
    }

    const alunoUuid = alunoResult.rows[0].uuid;
    const isAutor = await this.projetosDao.verificarAutorProjeto(
      projetoUuid,
      alunoUuid,
    );

    if (!isAutor && usuario.tipo !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para publicar este projeto',
      );
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Publica projeto
      await this.projetosDao.publicarProjeto(projetoUuid, dados, client);

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

    return this.projetosDao.listarMeusProjetos(usuario.uuid);
  }
}
