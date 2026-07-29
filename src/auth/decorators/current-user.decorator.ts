import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

type AuthenticatedRequest = Request & { user?: JwtPayload };

export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | 'id' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) return null;

    // 'id' es un alias de 'sub' para compatibilidad
    const resolvedField = field === 'id' ? 'sub' : field;
    return resolvedField ? user[resolvedField] : user;
  },
);
