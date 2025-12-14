import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import * as UAParser from 'ua-parser-js';
import { SessoesDAO } from './sessoes.dao';
import { SessaoResponseDTO, ListaSessoesResponseDTO } from './dto/sessao.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class SessoesService {
  private readonly logger = new Logger(SessoesService.name);

  constructor(
    private readonly sessoesDAO: SessoesDAO,
    private readonly notificacoesService: NotificacoesService,
  ) { }

  /**
   * Gera hash SHA-256 do token para armazenamento seguro
   */
  gerarTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parseia o User-Agent para extrair informações do dispositivo
   */
  parseUserAgent(userAgent: string): {
    navegador: string;
    sistemaOperacional: string;
    dispositivo: string;
  } {
    const parser = new UAParser.UAParser(userAgent);
    const result = parser.getResult();

    const browser = result.browser;
    const os = result.os;
    const device = result.device;

    const navegador = browser.name
      ? `${browser.name}${browser.version ? ' ' + browser.major : ''}`
      : 'Navegador desconhecido';

    const sistemaOperacional = os.name
      ? `${os.name}${os.version ? ' ' + os.version : ''}`
      : 'Sistema desconhecido';

    let dispositivo = 'Desktop';
    if (device.type) {
      if (device.type === 'mobile') dispositivo = 'Mobile';
      else if (device.type === 'tablet') dispositivo = 'Tablet';
    }

    return { navegador, sistemaOperacional, dispositivo };
  }

  /**
   * Mascara o IP para exibição (privacidade)
   */
  mascararIP(ip: string): string {
    if (!ip || ip === 'unknown') return 'IP desconhecido';

    // IPv4: mostra apenas os primeiros dois octetos
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.*.*`;
      }
    }

    // IPv6: mostra apenas os primeiros grupos
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}:*:*`;
      }
    }

    return 'IP desconhecido';
  }

  /**
   * Cria uma nova sessão após login bem-sucedido
   */
  async criarSessao(
    usuarioUuid: string,
    token: string,
    ip: string,
    userAgent: string,
    localizacao?: string,
  ): Promise<void> {
    const tokenHash = this.gerarTokenHash(token);
    const { navegador, sistemaOperacional, dispositivo } = this.parseUserAgent(userAgent);

    // Calcula expiração (24 horas, igual ao JWT)
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 24);

    // Verifica se já existe uma sessão ativa para este mesmo IP e User-Agent
    const sessaoExistente = await this.sessoesDAO.buscarSessaoExistente(
      usuarioUuid,
      ip,
      userAgent
    );

    if (sessaoExistente) {
      // Reutiliza a sessão existente, atualizando o token e validade
      await this.sessoesDAO.atualizarTokenSessao(
        sessaoExistente.uuid,
        tokenHash,
        expiraEm
      );
      this.logger.log(`Sessão reutilizada para usuário ${usuarioUuid} - ${navegador} no ${dispositivo}`);
      return;
    }

    // Se não existir, verifica se é um novo dispositivo para notificação
    const dispositivoConhecido = await this.sessoesDAO.verificarDispositivoConhecido(
      usuarioUuid,
      navegador,
      sistemaOperacional,
    );

    // Cria a sessão
    await this.sessoesDAO.criarSessao({
      usuario_uuid: usuarioUuid,
      token_hash: tokenHash,
      ip_address: ip,
      user_agent: userAgent,
      navegador,
      sistema_operacional: sistemaOperacional,
      dispositivo,
      localizacao: localizacao || null,
      expira_em: expiraEm,
    });

    this.logger.log(`Sessão criada para usuário ${usuarioUuid} - ${navegador} no ${dispositivo}`);

    // Se for dispositivo novo, envia notificação
    if (!dispositivoConhecido) {
      await this.notificarNovoDispositivo(
        usuarioUuid,
        navegador,
        sistemaOperacional,
        dispositivo,
        this.mascararIP(ip),
      );
    }
  }

  /**
   * Notifica o usuário sobre login em novo dispositivo
   */
  private async notificarNovoDispositivo(
    usuarioUuid: string,
    navegador: string,
    sistemaOperacional: string,
    dispositivo: string,
    ipMascarado: string,
  ): Promise<void> {
    const titulo = '🔔 Novo acesso detectado';
    const mensagem = `Um novo login foi detectado em sua conta:\n\n` +
      `📱 Dispositivo: ${dispositivo}\n` +
      `🌐 Navegador: ${navegador}\n` +
      `💻 Sistema: ${sistemaOperacional}\n` +
      `📍 IP: ${ipMascarado}\n\n` +
      `Se não foi você, acesse as configurações de segurança para encerrar esta sessão.`;

    try {
      await this.notificacoesService.criarNotificacao(
        usuarioUuid,
        'SISTEMA',
        titulo,
        mensagem,
        '/configuracoes?tab=seguranca',
      );
      this.logger.log(`Notificação de novo dispositivo enviada para ${usuarioUuid}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar notificação de novo dispositivo: ${error.message}`);
    }
  }

  /**
   * Lista todas as sessões ativas do usuário
   */
  async listarSessoes(usuarioUuid: string, tokenAtual: string): Promise<ListaSessoesResponseDTO> {
    const tokenHashAtual = this.gerarTokenHash(tokenAtual);
    const sessoes = await this.sessoesDAO.buscarSessoesAtivas(usuarioUuid);

    const sessoesFormatadas: SessaoResponseDTO[] = sessoes.map(sessao => {
      // Verifica se é a sessão atual comparando via busca no banco
      const isCurrent = sessao.uuid === sessoes.find(s => {
        // Como não temos acesso ao token_hash aqui, usamos outro método
        return false;
      })?.uuid;

      return {
        uuid: sessao.uuid,
        navegador: sessao.navegador || 'Navegador desconhecido',
        sistema_operacional: sessao.sistema_operacional || 'Sistema desconhecido',
        dispositivo: sessao.dispositivo || 'Desktop',
        localizacao: sessao.localizacao || 'Localização desconhecida',
        ip_mascarado: this.mascararIP(sessao.ip_address),
        criado_em: sessao.criado_em.toISOString(),
        ultimo_acesso: sessao.ultimo_acesso.toISOString(),
        is_current: false, // Será atualizado abaixo
      };
    });

    // Identifica a sessão atual pelo token hash
    const sessaoAtual = await this.sessoesDAO.buscarPorTokenHash(tokenHashAtual);
    if (sessaoAtual) {
      const index = sessoesFormatadas.findIndex(s => s.uuid === sessaoAtual.uuid);
      if (index !== -1) {
        sessoesFormatadas[index].is_current = true;
      }
    }

    return {
      sessoes: sessoesFormatadas,
      total: sessoesFormatadas.length,
    };
  }

  /**
   * Encerra uma sessão específica
   */
  async encerrarSessao(
    usuarioUuid: string,
    sessaoUuid: string,
    tokenAtual: string,
  ): Promise<void> {
    // Verifica se a sessão pertence ao usuário
    const sessao = await this.sessoesDAO.buscarPorUuid(sessaoUuid);

    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (sessao.usuario_uuid !== usuarioUuid) {
      throw new ForbiddenException('Você não tem permissão para encerrar esta sessão');
    }

    // Não permite encerrar a sessão atual por este endpoint
    const tokenHashAtual = this.gerarTokenHash(tokenAtual);
    const sessaoAtual = await this.sessoesDAO.buscarPorTokenHash(tokenHashAtual);

    if (sessaoAtual && sessaoAtual.uuid === sessaoUuid) {
      throw new ForbiddenException('Para encerrar a sessão atual, use o logout');
    }

    await this.sessoesDAO.desativarSessao(sessaoUuid);
    this.logger.log(`Sessão ${sessaoUuid} encerrada pelo usuário ${usuarioUuid}`);
  }

  /**
   * Encerra todas as outras sessões (exceto a atual)
   */
  async encerrarOutrasSessoes(usuarioUuid: string, tokenAtual: string): Promise<number> {
    const tokenHashAtual = this.gerarTokenHash(tokenAtual);
    const count = await this.sessoesDAO.desativarOutrasSessoes(usuarioUuid, tokenHashAtual);
    this.logger.log(`${count} sessões encerradas para o usuário ${usuarioUuid}`);
    return count;
  }

  /**
   * Desativa a sessão no logout
   */
  async encerrarSessaoAtual(token: string): Promise<void> {
    const tokenHash = this.gerarTokenHash(token);
    await this.sessoesDAO.desativarSessaoPorToken(tokenHash);
  }

  /**
   * Atualiza o último acesso da sessão
   */
  async atualizarUltimoAcesso(token: string): Promise<void> {
    const tokenHash = this.gerarTokenHash(token);
    await this.sessoesDAO.atualizarUltimoAcesso(tokenHash);
  }

  /**
   * Job de limpeza executado a cada hora
   * Remove sessões expiradas e inativas há mais de 7 dias
   */
  @Cron(CronExpression.EVERY_HOUR)
  async limparSessoesExpiradas(): Promise<void> {
    try {
      const count = await this.sessoesDAO.limparSessoesExpiradas();
      if (count > 0) {
        this.logger.log(`Job de limpeza: ${count} sessões expiradas removidas`);
      }
    } catch (error) {
      this.logger.error(`Erro no job de limpeza de sessões: ${error.message}`);
    }
  }
}
