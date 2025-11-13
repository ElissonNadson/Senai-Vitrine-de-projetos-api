import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { SisfreqDAO } from '../sisfreq/sisfreq.dao';

@Module({
  providers: [AuthService, JwtService, SisfreqDAO],
  controllers: [AuthController]
})
export class AuthModule { }
