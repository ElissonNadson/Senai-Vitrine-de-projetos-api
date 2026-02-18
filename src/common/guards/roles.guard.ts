import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ADMIN_EMAILS = [
  'nadsonnodachi@gmail.com',
  'admin@admin.com',
  'senaifeira@senaifeira',
];

/**
 * Guard para verificar roles do usuário
 * Usa em conjunto com @Roles() decorator
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const isAdmin =
      user.tipo === 'ADMIN' ||
      ADMIN_EMAILS.includes(user.email?.toLowerCase());

    const hasRole =
      isAdmin && requiredRoles.includes('ADMIN')
        ? true
        : requiredRoles.some((role) => user.tipo === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Roles necessárias: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
