import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class NewsAdminGuard implements CanActivate {
    // Lista de e-mails permitidos hardcoded conforme solicitação
    private readonly allowedEmails = [
        'nadsonnodachi@gmail.com',
        'admin@admin.com',
        'senaifeira@senaifeira' // Assumindo que este seja um user system ou similar
    ];

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return false;
        }

        // Permitir se for ADMIN ou estiver na lista de emails
        if (user.tipo === 'ADMIN' || this.allowedEmails.includes(user.email)) {
            return true;
        }

        throw new ForbiddenException('Acesso negado: Você não tem permissão para gerenciar notícias.');
    }
}
