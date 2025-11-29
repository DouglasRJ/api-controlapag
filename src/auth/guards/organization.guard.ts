import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * Guard que verifica se o usuário pertence à organização especificada no parâmetro da rota
 * ou se é MASTER/SUB_PROVIDER da organização
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const params = request.params;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Se o usuário é MASTER, pode acessar qualquer organização que ele seja owner
    if (user.role === USER_ROLE.MASTER) {
      // Verificação adicional pode ser feita no controller/service
      return true;
    }

    // SUB_PROVIDER e outros devem ter organizationId correspondente
    if (params.organizationId) {
      if (user.organizationId === params.organizationId) {
        return true;
      }
    }

    // Se não há organizationId nos params, permitir (será validado no service)
    if (!params.organizationId) {
      return true;
    }

    throw new UnauthorizedException(
      'You do not have access to this organization',
    );
  }
}

