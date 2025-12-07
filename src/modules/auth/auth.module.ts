import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessoesModule } from '../sessoes/sessoes.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Use registerAsync so the secret is read from ConfigService (dotenv already initialized in AppModule)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'default-secret-change-me',
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES') || '24h', // 86400 segundos
        },
      }),
    }),
    forwardRef(() => SessoesModule),
  ],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
