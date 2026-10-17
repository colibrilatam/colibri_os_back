import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../auth/decorators/public.decorator';

const startedAt = Date.now();

/**
 * QA-001: Health y readiness son públicos por diseño (ver
 * docs/security/authorization-matrix.md §4.25 y §7). Antes quedaban detrás del
 * JwtAuthGuard global (deny-by-default) y respondían 401, rompiendo los health
 * checks de infraestructura y el smoke test de CI.
 */
@Public()
@Controller()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return {
      status: 'ok',
      version: process.env.npm_package_version ?? 'unknown',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    };
  }

  @Get('ready')
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ready',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
