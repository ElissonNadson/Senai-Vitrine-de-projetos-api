import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminProjetosDao } from './admin-projetos.dao';

@Injectable()
export class AdminProjetosService {
  constructor(private readonly dao: AdminProjetosDao) {}

  listarTodos(filters: any) {
    return this.dao.listarTodos(filters);
  }

  async alterarStatus(projetoUuid: string, novoStatus: string, observacao?: string) {
    const validStatus = ['RASCUNHO', 'PUBLICADO', 'DESATIVADO'];
    if (!validStatus.includes(novoStatus)) {
      throw new BadRequestException(`Status inválido. Deve ser um de: ${validStatus.join(', ')}`);
    }
    const result = await this.dao.alterarStatus(projetoUuid, novoStatus, observacao);
    if (!result) throw new NotFoundException('Projeto não encontrado');
    return result;
  }

  async alterarFase(projetoUuid: string, novaFase: string, adminUuid: string, observacao?: string) {
    const validFases = ['IDEACAO', 'MODELAGEM', 'PROTOTIPAGEM', 'IMPLEMENTACAO'];
    if (!validFases.includes(novaFase)) {
      throw new BadRequestException(`Fase inválida. Deve ser uma de: ${validFases.join(', ')}`);
    }
    return this.dao.alterarFase(projetoUuid, novaFase, adminUuid, observacao);
  }

  async removerIntegrante(projetoUuid: string, usuarioUuid: string) {
    const result = await this.dao.removerIntegrante(projetoUuid, usuarioUuid);
    if (!result) throw new NotFoundException('Integrante não encontrado no projeto');
    return result;
  }

  async alterarPapelIntegrante(projetoUuid: string, usuarioUuid: string, novoPapel: string) {
    const result = await this.dao.alterarPapelIntegrante(projetoUuid, usuarioUuid, novoPapel);
    if (!result) throw new NotFoundException('Integrante não encontrado no projeto');
    return result;
  }

  async excluirProjeto(projetoUuid: string) {
    const result = await this.dao.excluirProjeto(projetoUuid);
    if (!result) throw new NotFoundException('Projeto não encontrado');
    return result;
  }
}
