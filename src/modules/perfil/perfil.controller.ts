import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PerfilService } from './perfil.service';
import {
  CompletarCadastroAlunoDto,
  CompletarCadastroDocenteDto,
  AtualizarPerfilDto,
} from './dto/perfil.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('perfil')
@UseGuards(AuthGuard('jwt'))
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  /**
   * POST /perfil/completar/aluno
   * Completa cadastro de aluno
   */
  @Post('completar/aluno')
  @HttpCode(HttpStatus.OK)
  async completarCadastroAluno(
    @Body() dto: CompletarCadastroAlunoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.perfilService.completarCadastroAluno(dto, user);
  }

  /**
   * POST /perfil/completar/docente
   * Completa cadastro de docente
   */
  @Post('completar/docente')
  @HttpCode(HttpStatus.OK)
  async completarCadastroDocente(
    @Body() dto: CompletarCadastroDocenteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.perfilService.completarCadastroDocente(dto, user);
  }

  /**
   * PATCH /perfil
   * Atualiza perfil do usuário logado
   */
  @Patch()
  @HttpCode(HttpStatus.OK)
  async atualizarPerfil(
    @Body() dto: AtualizarPerfilDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.perfilService.atualizarPerfil(dto, user);
  }

  /**
   * GET /perfil
   * Retorna perfil do usuário logado
   */
  @Get()
  async buscarPerfil(@CurrentUser() user: JwtPayload) {
    return this.perfilService.buscarPerfil(user);
  }

  /**
   * GET /perfil/pesquisar
   * Busca usuários por nome ou email
   */
  @Get('pesquisar')
  async pesquisarUsuarios(
    @Query('q') term: string,
    @Query('tipo') tipo?: 'ALUNO' | 'DOCENTE',
  ) {
    return this.perfilService.buscarUsuarios(term, tipo);
  }
}
