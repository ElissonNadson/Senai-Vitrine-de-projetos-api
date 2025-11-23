import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as pg from 'pg';
import { GoogleUserDto, AuthResponseDto } from './dto/auth.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject('PG_POOL') private readonly pool: pg.Pool,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Valida callback do Google OAuth e cria/atualiza usuário
   */
  async validarCallback(googleUser: GoogleUserDto): Promise<AuthResponseDto> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Busca usuário existente por email
      const usuarioExistente = await client.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [googleUser.email],
      );

      let usuario;
      let primeiroAcesso = false;

      if (usuarioExistente.rows.length === 0) {
        // Cria novo usuário
        usuario = await this.criarNovoUsuario(client, googleUser);
        primeiroAcesso = true;
      } else {
        // Atualiza dados do usuário existente
        usuario = await this.atualizarUsuario(
          client,
          usuarioExistente.rows[0],
          googleUser,
        );
        primeiroAcesso = usuario.primeiro_acesso;
      }

      await client.query('COMMIT');

      // Gera token JWT
      const token = await this.gerarToken(usuario);

      return {
        token,
        usuario: {
          uuid: usuario.uuid,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
          avatarUrl: usuario.avatar_url,
          primeiroAcesso,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao validar callback:', error);
      throw new InternalServerErrorException(
        'Erro ao processar autenticação',
      );
    } finally {
      client.release();
    }
  }

  /**
   * Cria novo usuário no banco de dados
   */
  private async criarNovoUsuario(
    client: pg.PoolClient,
    googleUser: GoogleUserDto,
  ): Promise<any> {
    // Insere na tabela usuarios
    const usuarioResult = await client.query(
      `INSERT INTO usuarios (email, nome, avatar_url, google_id, tipo, primeiro_acesso, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        googleUser.email,
        googleUser.nome,
        googleUser.avatarUrl,
        googleUser.googleId,
        googleUser.tipo,
        true, // primeiro_acesso
        true, // ativo
      ],
    );

    const usuario = usuarioResult.rows[0];

    // Cria registro em alunos ou professores
    if (googleUser.tipo === 'ALUNO') {
      await client.query(
        'INSERT INTO alunos (usuario_uuid) VALUES ($1)',
        [usuario.uuid],
      );
    } else if (googleUser.tipo === 'PROFESSOR') {
      await client.query(
        'INSERT INTO professores (usuario_uuid) VALUES ($1)',
        [usuario.uuid],
      );
    }

    return usuario;
  }

  /**
   * Atualiza dados do usuário existente
   */
  private async atualizarUsuario(
    client: pg.PoolClient,
    usuarioExistente: any,
    googleUser: GoogleUserDto,
  ): Promise<any> {
    const result = await client.query(
      `UPDATE usuarios
       SET nome = $1, avatar_url = $2, google_id = $3, atualizado_em = NOW()
       WHERE uuid = $4
       RETURNING *`,
      [
        googleUser.nome,
        googleUser.avatarUrl,
        googleUser.googleId,
        usuarioExistente.uuid,
      ],
    );

    return result.rows[0];
  }

  /**
   * Gera token JWT
   */
  private async gerarToken(usuario: any): Promise<string> {
    // Não incluir `iat`/`exp` manualmente: o JwtModule já aplica `signOptions.expiresIn`
    const payload: JwtPayload = {
      uuid: usuario.uuid,
      email: usuario.email,
      tipo: usuario.tipo,
      nome: usuario.nome,
      googleId: usuario.google_id,
      primeiroAcesso: usuario.primeiro_acesso,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Registra login na auditoria
   */
  private async registrarLoginAuditoria(usuario: any): Promise<void> {
    try {
      // Busca matrícula e login do usuário
      let matricula = null;
      let login = usuario.email.split('@')[0];

      if (usuario.tipo === 'ALUNO') {
        const alunoResult = await this.pool.query(
          'SELECT matricula FROM alunos WHERE usuario_uuid = $1',
          [usuario.uuid],
        );
        if (alunoResult.rows.length > 0) {
          matricula = alunoResult.rows[0].matricula;
        }
      } else if (usuario.tipo === 'PROFESSOR') {
        const professorResult = await this.pool.query(
          'SELECT matricula FROM professores WHERE usuario_uuid = $1',
          [usuario.uuid],
        );
        if (professorResult.rows.length > 0) {
          matricula = professorResult.rows[0].matricula;
        }
      }

      const jwtPayload: JwtPayload = {
        uuid: usuario.uuid,
        email: usuario.email,
        tipo: usuario.tipo,
        nome: usuario.nome,
        googleId: usuario.google_id,
        primeiroAcesso: usuario.primeiro_acesso,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      };

    } catch (error) {
      console.error('Erro ao registrar auditoria de login:', error);
      // Não lança erro para não bloquear o login
    }
  }

  /**
   * Renova token JWT
   */
  async renovarToken(tokenAntigo: string): Promise<{ token: string; expiresIn: number }> {
    try {
      const payload = this.jwtService.verify(tokenAntigo, {
        secret: process.env.JWT_SECRET,
      });

      // Busca dados atualizados do usuário
      const usuarioResult = await this.pool.query(
        'SELECT * FROM usuarios WHERE uuid = $1 AND ativo = TRUE',
        [payload.uuid],
      );

      if (usuarioResult.rows.length === 0) {
        throw new UnauthorizedException('Usuário não encontrado ou inativo');
      }

      const usuario = usuarioResult.rows[0];

      // Gera novo token
      const novoToken = await this.gerarToken(usuario);

      return {
        token: novoToken,
        expiresIn: 86400, // 24 horas
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  /**
   * Retorna dados do usuário logado
   */
  async obterUsuarioAtual(uuid: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT 
        u.uuid, u.nome, u.email, u.tipo, u.avatar_url, u.primeiro_acesso,
        CASE 
          WHEN u.tipo = 'ALUNO' THEN json_build_object(
            'uuid', a.uuid,
            'matricula', a.matricula,
            'curso', c.nome,
            'turma', t.codigo,
            'telefone', a.telefone,
            'bio', a.bio,
            'linkedin_url', a.linkedin_url,
            'github_url', a.github_url,
            'portfolio_url', a.portfolio_url
          )
          WHEN u.tipo = 'PROFESSOR' THEN json_build_object(
            'uuid', p.uuid,
            'matricula', p.matricula,
            'departamento', d.nome,
            'especialidade', p.especialidade,
            'telefone', p.telefone,
            'bio', p.bio,
            'linkedin_url', p.linkedin_url,
            'lattes_url', p.lattes_url
          )
          ELSE NULL
        END as perfil_especifico
      FROM usuarios u
      LEFT JOIN alunos a ON u.uuid = a.usuario_uuid AND u.tipo = 'ALUNO'
      LEFT JOIN cursos c ON a.curso_uuid = c.uuid
      LEFT JOIN turmas t ON a.turma_uuid = t.uuid
      LEFT JOIN professores p ON u.uuid = p.usuario_uuid AND u.tipo = 'PROFESSOR'
      LEFT JOIN departamentos d ON p.departamento_uuid = d.uuid
      WHERE u.uuid = $1 AND u.ativo = TRUE`,
      [uuid],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const usuario = result.rows[0];

    return {
      uuid: usuario.uuid,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      avatarUrl: usuario.avatar_url,
      primeiroAcesso: usuario.primeiro_acesso,
      ...(usuario.tipo === 'ALUNO' && { aluno: usuario.perfil_especifico }),
      ...(usuario.tipo === 'PROFESSOR' && { professor: usuario.perfil_especifico }),
    };
  }

  /**
   * Logout (invalida token - apenas frontend remove localStorage)
   */
  async logout(res: any): Promise<{ mensagem: string }> {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return { mensagem: 'Logout realizado com sucesso' };
  }
}
