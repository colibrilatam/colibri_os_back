// src/auth/guards/roles.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

type AuthenticatedRequest = Request & { user?: JwtPayload };

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      // SEC-002 / PR-BE2: fase 1 — log-only. Cuando RolesGuard está vinculado
      // pero no hay @Roles, el endpoint queda abierto a cualquier rol
      // autenticado. Esto puede ser intencional (el endpoint solo necesita
      // JwtAuthGuard) o un olvido (el desarrollador quiso restringir y no
      // agregó @Roles).
      //
      // Durante esta fase solo se registra. Cuando se active el modo
      // enforce (ROLES_GUARD_ENFORCE=true), el endpoint se bloquea con 403
      // hasta que se agregue @Roles explícito.
      const handler = context.getHandler();
      const controllerClass = context.getClass();
      const handlerName = handler.name || 'anonymous';
      const controllerName = controllerClass.name || 'unknown';
      const request = context.switchToHttp().getRequest();

      const enforce = process.env.ROLES_GUARD_ENFORCE === 'true';

      // Log estructurado (JSON) para que el auditor pueda filtrar por
      // "event":"roles_guard_no_metadata" en los logs del contenedor.
      this.logger.warn(
        JSON.stringify({
          event: 'roles_guard_no_metadata',
          enforce,
          controller: controllerName,
          handler: handlerName,
          method: request?.method,
          path: request?.route?.path ?? request?.url,
          userId: request?.user?.sub ?? null,
          timestamp: new Date().toISOString(),
        }),
      );

      if (enforce) {
        throw new ForbiddenException(
          'Este endpoint no tiene roles definidos. Se requiere @Roles explícito.',
        );
      }

      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Rol "${user.role}" no tiene permiso para acceder a este recurso`,
      );
    }

    return true;
  }
}
