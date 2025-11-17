import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para definir roles permitidas em uma rota
 * 
 * @param roles - Array de roles permitidas (ALUNO, PROFESSOR, ADMIN)
 * 
 * @example
 * @Roles('ADMIN')
 * @Get('/admin/usuarios')
 * listarUsuarios() { ... }
 * 
 * @example
 * @Roles('PROFESSOR', 'ADMIN')
 * @Post('/projetos/:id/avaliar')
 * avaliarProjeto() { ... }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
