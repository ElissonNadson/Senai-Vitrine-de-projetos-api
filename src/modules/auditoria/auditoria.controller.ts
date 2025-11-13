import { CreateAuditoriaDto, CreateAuditoriaZodDto } from './dto/create-tabulacao.dto';
import { UserFromCookie } from '../../common/decorators/user-from-cookie.decorator';
import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AuditoriaService } from './auditoria.service';

@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(CreateAuditoriaZodDto.schema)) body: CreateAuditoriaDto, @UserFromCookie() user: JwtPayload) {
    return this.auditoriaService.create(body, user);
  }
}