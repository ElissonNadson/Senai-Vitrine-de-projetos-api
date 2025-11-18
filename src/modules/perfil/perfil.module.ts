import { Module } from '@nestjs/common';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';
import { PerfilDao } from './perfil.dao';

@Module({
  imports: [],
  controllers: [PerfilController],
  providers: [PerfilService, PerfilDao],
  exports: [PerfilService],
})
export class PerfilModule {}
