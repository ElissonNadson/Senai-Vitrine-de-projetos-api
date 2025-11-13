import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SisfreqDAO } from '../sisfreq/sisfreq.dao';
import { JwtService } from '@nestjs/jwt';
import { decode } from 'jsonwebtoken';
import { Logar } from './auth.dto';
import * as https from 'https';
import axios from 'axios';
import * as pg from 'pg';

@Injectable()
export class AuthService {
  constructor(
    @Inject('PG_POOL') private readonly db: pg.Pool,
    private readonly jwtService: JwtService,
    private readonly sisfreqDAO: SisfreqDAO
  ) { }

  async logar(logar: Logar, res) {
    const { login, senha } = logar;
    
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    try {  
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Lança um erro de autenticação
          throw new UnauthorizedException('Credenciais inválidas');
        }

        console.error(error);

        // Lança um erro de API
        throw new Error(`Erro na API externa: ${error.message}`);
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Lança outros erros não relacionados ao Axios
      throw new Error(`Erro inesperado: ${error.message}`);
    }
  }

  async isAuthenticated(req) {
    const token = req.cookies?.token;
    if (!token) {
      throw new UnauthorizedException('Token não encontrado no cookie.');
    }

    try {
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET_KEY });
      return decoded; // 👈 retorna o payload do token
    } catch (err) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }

  async logout(res) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV == 'production' ? true : false,
      sameSite: process.env.NODE_ENV == 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV == 'PRODUCTION' ? 'senai.br' : 'localhost',
    });
    return { success: true, message: 'Logout realizado com sucesso.' };
  }
}
