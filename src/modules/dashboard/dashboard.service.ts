import { Injectable, ForbiddenException } from '@nestjs/common';
import { DashboardDao } from './dashboard.dao';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardDao: DashboardDao) {}

  /**
   * Retorna dashboard apropriado baseado no tipo de usuário
   */
  async getDashboard(usuario: any): Promise<any> {
    if (!usuario || !usuario.uuid || !usuario.tipo) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    switch (usuario.tipo) {
      case 'ALUNO':
        return this.getDashboardAluno(usuario.uuid);

      case 'PROFESSOR':
        return this.getDashboardProfessor(usuario.uuid);

      case 'ADMIN':
        return this.getDashboardAdmin();

      default:
        throw new ForbiddenException('Tipo de usuário inválido');
    }
  }

  /**
   * Dashboard específico para alunos
   */
  private async getDashboardAluno(usuarioUuid: string): Promise<any> {
    const dashboard = await this.dashboardDao.getDashboardAluno(usuarioUuid);

    if (!dashboard) {
      throw new ForbiddenException('Perfil de aluno não encontrado');
    }

    return {
      tipo: 'ALUNO',
      ...dashboard,
    };
  }

  /**
   * Dashboard específico para professores
   */
  private async getDashboardProfessor(usuarioUuid: string): Promise<any> {
    const dashboard = await this.dashboardDao.getDashboardProfessor(usuarioUuid);

    if (!dashboard) {
      throw new ForbiddenException('Perfil de professor não encontrado');
    }

    return {
      tipo: 'PROFESSOR',
      ...dashboard,
    };
  }

  /**
   * Dashboard específico para administradores
   */
  private async getDashboardAdmin(): Promise<any> {
    const dashboard = await this.dashboardDao.getDashboardAdmin();

    return {
      tipo: 'ADMIN',
      ...dashboard,
    };
  }
}
