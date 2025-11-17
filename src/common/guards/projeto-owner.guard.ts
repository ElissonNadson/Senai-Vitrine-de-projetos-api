import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { Inject } from '@nestjs/common';

/**
 * Guard para verificar se usuário é dono/líder do projeto
 * Permite também orientadores e admin
 */
@Injectable()
export class ProjetoOwnerGuard implements CanActivate {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projetoUuid = request.params.uuid || request.params.id;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (!projetoUuid) {
      throw new ForbiddenException('UUID do projeto não fornecido');
    }

    // Admin tem acesso total
    if (user.tipo === 'ADMIN') {
      return true;
    }

    // Verifica se projeto existe
    const projetoQuery = await this.pool.query(
      'SELECT lider_uuid, status FROM projetos WHERE uuid = $1',
      [projetoUuid],
    );

    if (projetoQuery.rows.length === 0) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const projeto = projetoQuery.rows[0];

    // Verifica se é o líder
    if (projeto.lider_uuid === user.uuid) {
      return true;
    }

    // Verifica se é autor do projeto
    if (user.tipo === 'ALUNO') {
      const autorQuery = await this.pool.query(
        `SELECT pa.uuid FROM projetos_alunos pa
         INNER JOIN alunos a ON pa.aluno_uuid = a.uuid
         WHERE pa.projeto_uuid = $1 AND a.usuario_uuid = $2`,
        [projetoUuid, user.uuid],
      );

      if (autorQuery.rows.length > 0) {
        return true;
      }
    }

    // Verifica se é orientador do projeto
    if (user.tipo === 'PROFESSOR') {
      const orientadorQuery = await this.pool.query(
        `SELECT pp.uuid FROM projetos_professores pp
         INNER JOIN professores p ON pp.professor_uuid = p.uuid
         WHERE pp.projeto_uuid = $1 AND p.usuario_uuid = $2`,
        [projetoUuid, user.uuid],
      );

      if (orientadorQuery.rows.length > 0) {
        return true;
      }
    }

    throw new ForbiddenException(
      'Você não tem permissão para acessar este projeto',
    );
  }
}
