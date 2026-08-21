import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';
import { AuthorizationDenialAudit, DenialReason } from './entities/authorization-denial-audit.entity';

export interface DenialInput {
  resourceType: string;
  resourceId?: string | null;
  action: string;
  attemptedByUserId: string;
  attemptedByRole: UserRole;
  reason: DenialReason;
}

@Injectable()
export class AuthorizationAuditService {
  private readonly logger = new Logger(AuthorizationAuditService.name);

  constructor(
    @InjectRepository(AuthorizationDenialAudit)
    private readonly repository: Repository<AuthorizationDenialAudit>,
  ) {}

  /**
   * Registra un rechazo de autorización. Nunca debe romper el flujo que la
   * invoca: si falla la escritura de auditoría, se loguea y se sigue —
   * perder la denegación real (el 403 al usuario) sería peor que perder el registro.
   */
  async logDenial(input: DenialInput): Promise<void> {
    try {
      await this.repository.save(this.repository.create(input));
    } catch (error) {
      this.logger.error(
        `No se pudo registrar la auditoría de rechazo para ${input.resourceType}:${input.resourceId ?? 'n/a'}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}