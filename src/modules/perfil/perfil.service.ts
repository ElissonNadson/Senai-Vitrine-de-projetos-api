import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PerfilDao } from './perfil.dao';
import {
  CompletarCadastroAlunoDto,
  CompletarCadastroDocenteDto,
  AtualizarPerfilDto,
} from './dto/perfil.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class PerfilService {
  constructor(private readonly perfilDao: PerfilDao) {}

  /**
   * Completa cadastro de aluno
   */
  async completarCadastroAluno(
    dto: CompletarCadastroAlunoDto,
    user: JwtPayload,
  ): Promise<any> {
    if (user.tipo !== 'ALUNO') {
      throw new BadRequestException('Usuário não é um aluno');
    }

    const client = await this.perfilDao.getClient();

    try {
      await client.query('BEGIN');

      // Verifica se matrícula já existe
      const matriculaExiste = await this.perfilDao.verificarMatriculaExistente(
        client,
        dto.matricula,
        'ALUNO',
        user.uuid,
      );

      if (matriculaExiste) {
        throw new ConflictException('Matrícula já cadastrada');
      }

      // Atualiza dados do aluno
      const alunoAtualizado = await this.perfilDao.atualizarAluno(
        client,
        user.uuid,
        dto,
      );

      // Marca cadastro como completo
      await this.perfilDao.marcarCadastroCompleto(client, user.uuid);

      await client.query('COMMIT');

      return {
        mensagem: 'Cadastro completado com sucesso',
        perfil: alunoAtualizado,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao completar cadastro: ' + error.message,
      );
    } finally {
      client.release();
    }
  }

  /**
   * Completa cadastro de docente
   */
  async completarCadastroDocente(
    dto: CompletarCadastroDocenteDto,
    user: JwtPayload,
  ): Promise<any> {
    if (user.tipo !== 'DOCENTE' && user.tipo !== 'ADMIN') {
      throw new BadRequestException('Usuário não é um docente');
    }

    const client = await this.perfilDao.getClient();

    try {
      await client.query('BEGIN');

      // Verifica se matrícula já existe (apenas se foi informada)
      if (dto.matricula) {
        const matriculaExiste =
          await this.perfilDao.verificarMatriculaExistente(
            client,
            dto.matricula,
            'DOCENTE',
            user.uuid,
          );

        if (matriculaExiste) {
          throw new ConflictException('Matrícula já cadastrada');
        }
      }

      // Atualiza dados do docente
      const docenteAtualizado = await this.perfilDao.atualizarDocente(
        client,
        user.uuid,
        dto,
      );

      // Marca cadastro como completo
      await this.perfilDao.marcarCadastroCompleto(client, user.uuid);

      await client.query('COMMIT');

      return {
        mensagem: 'Cadastro completado com sucesso',
        perfil: docenteAtualizado,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao completar cadastro: ' + error.message,
      );
    } finally {
      client.release();
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  async atualizarPerfil(
    dto: AtualizarPerfilDto,
    user: JwtPayload,
  ): Promise<any> {
    const client = await this.perfilDao.getClient();

    try {
      await client.query('BEGIN');

      let perfilAtualizado;

      if (user.tipo === 'ALUNO') {
        perfilAtualizado = await this.perfilDao.atualizarAluno(
          client,
          user.uuid,
          dto,
        );
      } else if (user.tipo === 'DOCENTE' || user.tipo === 'ADMIN') {
        perfilAtualizado = await this.perfilDao.atualizarDocente(
          client,
          user.uuid,
          dto,
        );
      } else {
        throw new BadRequestException('Tipo de usuário inválido');
      }

      await client.query('COMMIT');

      return {
        mensagem: 'Perfil atualizado com sucesso',
        perfil: perfilAtualizado,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao atualizar perfil: ' + error.message,
      );
    } finally {
      client.release();
    }
  }

  /**
   * Busca perfil do usuário
   */
  async buscarPerfil(user: JwtPayload): Promise<any> {
    const client = await this.perfilDao.getClient();

    try {
      let perfil;

      if (user.tipo === 'ALUNO') {
        perfil = await this.perfilDao.buscarAluno(client, user.uuid);
      } else if (user.tipo === 'DOCENTE' || user.tipo === 'ADMIN') {
        perfil = await this.perfilDao.buscarDocente(client, user.uuid);
      } else {
        throw new BadRequestException('Tipo de usuário inválido');
      }

      if (!perfil) {
        throw new NotFoundException('Perfil não encontrado');
      }

      return perfil;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Busca usuários por nome ou email
   */
  async buscarUsuarios(
    termo: string,
    tipo?: 'ALUNO' | 'DOCENTE',
  ): Promise<any[]> {
    if (!termo || termo.length < 3) {
      return [];
    }

    const client = await this.perfilDao.getClient();
    try {
      return await this.perfilDao.buscarUsuarios(client, termo, tipo);
    } finally {
      client.release();
    }
  }
}
