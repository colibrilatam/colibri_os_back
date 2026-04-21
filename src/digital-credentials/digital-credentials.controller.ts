// src/digital-credentials/digital-credentials.controller.ts

import {
  Controller, Get, Post, Param, Body,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam,
  ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
import { DigitalCredentialsService } from './digital-credentials.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Digital Credentials')
@ApiBearerAuth()
@Controller('digital-credentials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DigitalCredentialsController {
  constructor(private readonly service: DigitalCredentialsService) {}

  @Get('project/:projectId')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar credenciales de un proyecto' })
  @ApiParam({ name: 'projectId', example: 'proj-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Lista de credenciales del proyecto.' })
  findAllByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.service.findAllByProject(projectId);
  }

  @Get('user/:userId')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar credenciales de un usuario' })
  @ApiParam({ name: 'userId', example: 'user-uuid-001' })
  @ApiResponse({ status: 200, description: 'Lista de credenciales del usuario.' })
  findAllByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.findAllByUser(userId);
  }

  @Get(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener una credencial por ID' })
  @ApiParam({ name: 'id', example: 'cred-uuid-001' })
  @ApiResponse({ status: 200, description: 'Detalle de la credencial.' })
  @ApiResponse({ status: 404, description: 'Credencial no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/revoke')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar una credencial', description: 'Solo ADMIN. Requiere motivo de revocación.' })
  @ApiParam({ name: 'id', example: 'cred-uuid-001' })
  @ApiBody({ schema: { example: { reason: 'Evidencia invalidada por revisión posterior.' } } })
  @ApiResponse({ status: 200, description: 'Credencial revocada.' })
  @ApiResponse({ status: 400, description: 'La credencial ya estaba revocada.' })
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.service.revoke(id, reason);
  }
}