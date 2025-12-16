import { ProjetosService } from './projetos.service';
import { ProjetosDao } from './projetos.dao';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

describe('ProjetosService notificações', () => {
  const pool: any = { connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }) };
  const dao: any = {
    buscarPorUuid: jest.fn(),
    atualizarRepositorioPrivacidade: jest.fn(),
    registrarAuditoria: jest.fn(),
  } as Partial<ProjetosDao> as any;
  const notif: any = {
    notificarAutores: jest.fn().mockResolvedValue(undefined),
    notificarOrientadores: jest.fn().mockResolvedValue(undefined),
    criarNotificacao: jest.fn().mockResolvedValue(undefined),
  } as Partial<NotificacoesService> as any;

  it('deve notificar na publicação (Passo 5)', async () => {
    const service = new ProjetosService(pool as any, dao as any, notif as any);
    dao.buscarPorUuid.mockResolvedValue({ uuid: 'p1', titulo: 'Projeto X', status: 'RASCUNHO' });
    (pool.connect as jest.Mock).mockResolvedValue({
      query: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
    });

    await service.configurarRepositorioPasso5('p1', { aceitou_termos: true }, { uuid: 'u1', tipo: 'ALUNO' });

    expect(notif.notificarAutores).toHaveBeenCalled();
    expect(notif.notificarOrientadores).toHaveBeenCalled();
  });
});
