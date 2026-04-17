// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;

    // 'id' es un alias de 'sub' para compatibilidad
    const resolvedField = field === 'id' ? 'sub' : field;
    return resolvedField ? user?.[resolvedField] : user;
  },
);