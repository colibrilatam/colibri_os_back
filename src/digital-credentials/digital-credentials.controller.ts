// src/digital-credentials/digital-credentials.controller.ts

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { DigitalCredentialsService } from './digital-credentials.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectAccessService } from '../projects/project-access.service';

@ApiTags('Digital Credentials')
@ApiBearerAuth()
@Controller('digital-credentials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DigitalCredentialsController {
  constructor(
    private readonly service: DigitalCredentialsService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Listar credenciales de un proyecto' })
  @ApiParam({ name: 'projectId', example: 'proj-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Lista de credenciales del proyecto.' })
  async findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    await this.projectAccessService.assertCanAccessProject({ userId, role }, projectId);
    return this.service.findAllByProject(projectId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Listar credenciales de un usuario' })
  @ApiParam({ name: 'userId', example: 'user-uuid-001' })
  @ApiResponse({ status: 200, description: 'Lista de credenciales del usuario.' })
  async findAllByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    if (role !== UserRole.ADMIN && userId !== currentUserId) {
      throw new ForbiddenException('No tenés permiso para ver credenciales de otro usuario');
    }
    return this.service.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una credencial por ID' })
  @ApiParam({ name: 'id', example: 'cred-uuid-001' })
  @ApiResponse({ status: 200, description: 'Detalle de la credencial.' })
  @ApiResponse({ status: 404, description: 'Credencial no encontrada.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const credential = await this.service.findOne(id);
    if (role !== UserRole.ADMIN) {
      const hasAccess =
        credential.projectId
          ? (await this.projectAccessService.assertCanAccessProject({ userId, role }, credential.projectId).catch(() => null)) !== null
          : false;
      if (!hasAccess && credential.userId !== userId) {
        throw new ForbiddenException('No tenés permiso para ver esta credencial');
      }
    }
    return credential;
  }

  @Post(':id/revoke')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revocar una credencial',
    description: 'Solo ADMIN. Requiere motivo de revocación.',
  })
  @ApiParam({ name: 'id', example: 'cred-uuid-001' })
  @ApiBody({ schema: { example: { reason: 'Evidencia invalidada por revisión posterior.' } } })
  @ApiResponse({ status: 200, description: 'Credencial revocada.' })
  @ApiResponse({ status: 400, description: 'La credencial ya estaba revocada.' })
  revoke(@Param('id', ParseUUIDPipe) id: string, @Body('reason') reason: string) {
    return this.service.revoke(id, reason);
  }
}
