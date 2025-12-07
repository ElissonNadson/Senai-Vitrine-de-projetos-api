import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SessoesService } from './sessoes.service';
import { ListaSessoesResponseDTO } from './dto/sessao.dto';

interface RequestWithUser extends Request {
  user: {
    uuid: string;
    email: string;
    tipo: string;
    nome: string;
  };
}

@Controller('auth/sessions')
@UseGuards(AuthGuard)
export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  /**
   * Extrai o token da requisição
   */
  private extractToken(request: Request): string {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Fallback para cookie
    const cookies = request.cookies || {};
    return cookies.accessToken || '';
  }

  /**
   * Lista todas as sessões ativas do usuário
   * GET /auth/sessions
   */
  @Get()
  async listarSessoes(@Req() req: RequestWithUser): Promise<ListaSessoesResponseDTO> {
    const token = this.extractToken(req);
    return this.sessoesService.listarSessoes(req.user.uuid, token);
  }

  /**
   * Encerra todas as outras sessões (exceto a atual)
   * DELETE /auth/sessions/others
   * IMPORTANTE: Esta rota deve vir ANTES de :id para não ser capturada como parâmetro
   */
  @Delete('others')
  @HttpCode(HttpStatus.OK)
  async encerrarOutrasSessoes(@Req() req: RequestWithUser): Promise<{ count: number }> {
    const token = this.extractToken(req);
    const count = await this.sessoesService.encerrarOutrasSessoes(req.user.uuid, token);
    return { count };
  }

  /**
   * Encerra uma sessão específica
   * DELETE /auth/sessions/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async encerrarSessao(
    @Param('id') sessaoId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const token = this.extractToken(req);
    await this.sessoesService.encerrarSessao(req.user.uuid, sessaoId, token);
  }
}
