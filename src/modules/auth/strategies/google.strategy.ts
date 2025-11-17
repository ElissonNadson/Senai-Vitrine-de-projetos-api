import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import {
  validarEmailSenai,
  detectarTipoUsuario,
  TipoUsuario,
} from '../../../common/utils/email-validator.util';

/**
 * Estratégia Google OAuth 2.0
 * Valida domínios SENAI-BA e retorna dados do usuário
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    if (!emails || emails.length === 0) {
      return done(
        new UnauthorizedException('Email não fornecido pelo Google'),
        null,
      );
    }

    const email = emails[0].value;

    // Valida domínio SENAI-BA
    if (!validarEmailSenai(email)) {
      return done(
        new UnauthorizedException(
          'Email inválido. Use um email SENAI-BA (@ba.estudante.senai.br ou @ba.senai.br)',
        ),
        null,
      );
    }

    // Detecta tipo de usuário baseado no domínio
    const tipo = detectarTipoUsuario(email);

    if (tipo === TipoUsuario.INVALIDO) {
      return done(
        new UnauthorizedException('Domínio de email não autorizado'),
        null,
      );
    }

    const user = {
      googleId: id,
      email: email,
      nome: name.givenName + ' ' + name.familyName,
      primeiroNome: name.givenName,
      sobrenome: name.familyName,
      avatarUrl: photos && photos.length > 0 ? photos[0].value : null,
      tipo: tipo,
      accessToken,
    };

    done(null, user);
  }
}
