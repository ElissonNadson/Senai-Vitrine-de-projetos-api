import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Decorator para extrair usuário atual do request
 * Usa após AuthGuard validar o token
 * 
 * @example
 * @Get('/perfil')
 * @UseGuards(AuthGuard)
 * getPerfil(@CurrentUser() user: JwtPayload) {
 *   return { uuid: user.uuid, nome: user.nome };
 * }
 * 
 * @example
 * @Post('/projetos')
 * @UseGuards(AuthGuard)
 * criarProjeto(@CurrentUser('uuid') usuarioUuid: string) {
 *   // Extrai apenas o UUID
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
