import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createTestApp, closeTestApp, E2eContext } from '../e2e-setup';
import { IS_PUBLIC_KEY } from '../../src/auth/decorators/public.decorator';

describe('SEC-004 — Regresión: ningún endpoint sin guard y sin @Public()', () => {
  let ctx: E2eContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('todos los endpoints tienen guard de autenticación o están marcados como públicos', () => {
    const app: INestApplication = ctx.app;
    const reflector = app.get(Reflector);

    const allRoutes: { method: string; path: string; isPublic: boolean }[] = [];

    const router = (
      app.getHttpAdapter().getInstance() as {
        _router: { stack: Array<{ route?: { path: string; methods: Record<string, unknown> } }> };
      }
    )._router;

    router.stack.forEach((layer) => {
      if (layer.route) {
        const path = layer.route.path;
        Object.keys(layer.route.methods).forEach((m) => {
          allRoutes.push({ method: m.toUpperCase(), path, isPublic: false });
        });
      }
    });

    const modules = (
      app as unknown as {
        container: {
          getModules: () => Map<unknown, { controllers: Map<unknown, { instance: object }> }>;
        };
      }
    ).container.getModules();

    modules.forEach((module) => {
      module.controllers.forEach(({ instance }) => {
        if (!instance) return;

        const prototype = Object.getPrototypeOf(instance);
        const methodNames = Object.getOwnPropertyNames(prototype).filter(
          (name) =>
            name !== 'constructor' &&
            typeof (instance as Record<string, unknown>)[name] === 'function',
        );

        methodNames.forEach((methodName) => {
          const handler = (instance as Record<string, unknown>)[methodName] as (
            ...args: unknown[]
          ) => unknown;
          const isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, handler);
          if (isPublic) {
            const requestMapping = Reflect.getMetadata('path', handler);
            const method = Reflect.getMetadata('method', handler);
            if (requestMapping && method) {
              allRoutes.push({
                method: String(method).toUpperCase(),
                path: String(requestMapping),
                isPublic: true,
              });
            }
          }
        });
      });
    });

    const publicRoutes = allRoutes.filter((r) => r.isPublic);
    const nonPublicRoutes = allRoutes.filter(
      (r) =>
        !r.isPublic &&
        !r.path.includes('/health') &&
        !r.path.includes('/ready') &&
        !r.path.includes('/auth/'),
    );

    const uncovered = nonPublicRoutes.filter(
      (route) =>
        !publicRoutes.some((pub) => route.method === pub.method && route.path.includes(pub.path)),
    );

    expect(uncovered).toEqual([]);
  });
});
