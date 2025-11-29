import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<USER_ROLE[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      // Se não há roles especificadas, permitir acesso
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Verificar se o usuário tem uma das roles requeridas
    return requiredRoles.some((role) => {
      // Compatibilidade: PROVIDER é tratado como INDIVIDUAL ou MASTER
      if (role === USER_ROLE.PROVIDER) {
        return (
          user.role === USER_ROLE.PROVIDER ||
          user.role === USER_ROLE.INDIVIDUAL ||
          user.role === USER_ROLE.MASTER ||
          user.role === USER_ROLE.SUB_PROVIDER
        );
      }
      return user.role === role;
    });
  }
}

