// src/common/middleware/maintenance-mode.middleware.ts
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * OPS-001: bloqueo controlado de escrituras.
 *
 * Mitigación temporal mientras se implementa la remediación definitiva
 * de un riesgo detectado. Permite retirar el "modo escritura" de la API
 * sin apagar el servicio completo (los GET/HEAD y los health checks
 * siguen respondiendo).
 *
 * Activación / reversión:
 *   - Se activa poniendo MAINTENANCE_MODE=true en las variables de entorno
 *     del servicio (Render / .env) y reiniciando el proceso.
 *   - Se revierte volviendo MAINTENANCE_MODE=false (o eliminando la
 *     variable) y reiniciando. No requiere cambios de código ni deploy.
 *
 * Rutas exceptuadas (whitelist):
 *   - Definidas en MAINTENANCE_ALLOWED_PATHS (coma-separado), por defecto
 *     /api/v1/health y /api/v1/ready, para que el monitoreo y el balanceador
 *     de carga no marquen el servicio como caído.
 *
 * Métodos bloqueados: POST, PUT, PATCH, DELETE.
 * Métodos permitidos siempre: GET, HEAD, OPTIONS.
 */
@Injectable()
export class MaintenanceModeMiddleware implements NestMiddleware {
  private readonly logger = new Logger('MaintenanceMode');

  private readonly blockedMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  private readonly allowedPaths: string[];

  constructor() {
    const raw = process.env.MAINTENANCE_ALLOWED_PATHS ?? '/api/v1/health,/api/v1/ready';
    this.allowedPaths = raw
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  private isEnabled(): boolean {
    return process.env.MAINTENANCE_MODE === 'true';
  }

  private isAllowedPath(path: string): boolean {
    return this.allowedPaths.some((allowed) => path === allowed || path.startsWith(`${allowed}/`));
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.isEnabled()) {
      next();
      return;
    }

    if (!this.blockedMethods.has(req.method)) {
      next();
      return;
    }

    if (this.isAllowedPath(req.path)) {
      next();
      return;
    }

    // OPS-001: monitoreo de intentos rechazados durante el modo mantenimiento.
    this.logger.warn(
      JSON.stringify({
        event: 'maintenance_mode_write_blocked',
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
        timestamp: new Date().toISOString(),
      }),
    );

    res.status(503).json({
      statusCode: 503,
      error: 'Service Unavailable',
      message:
        'La API está temporalmente en modo mantenimiento. Las escrituras están deshabilitadas por seguridad. Intentá nuevamente más tarde.',
    });
  }
}