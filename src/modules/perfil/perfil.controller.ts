import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PerfilService } from './perfil.service';
import {
  CompletarCadastroAlunoDto,
  CompletarCadastroProfessorDto,
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
   * POST /perfil/completar/professor
   * Completa cadastro de professor
   */
  @Post('completar/professor')
  @HttpCode(HttpStatus.OK)
  async completarCadastroProfessor(
    @Body() dto: CompletarCadastroProfessorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.perfilService.completarCadastroProfessor(dto, user);
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
}
