// src/evidence/evidence.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  // ─── POST /evidence ───────────────────────────────────────────────────────────
  // El emprendedor crea una evidencia en estado DRAFT
  @Post()
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEvidenceDto,
  ) {
    return this.service.create(userId, dto);
  }

  // ─── POST /evidence/request-upload-url ───────────────────────────────────────
  // Paso 1 de subida de archivo: el backend genera una URL resumable de Drive
  // El frontend luego sube el archivo DIRECTO a esa URL (sin pasar por el backend)
  @Post('request-upload-url')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  requestUploadUrl(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.service.requestUploadUrl(userId, dto);
  }

  // ─── POST /evidence/confirm-upload ───────────────────────────────────────────
  // Paso 2 de subida de archivo: el frontend avisa que el archivo ya fue subido
  // El backend guarda el storageUri y crea la EvidenceVersion correspondiente
  @Post('confirm-upload')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  confirmUpload(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.service.confirmUpload(userId, dto);
  }

  // ─── POST /evidence/:id/submit ────────────────────────────────────────────────
  // El emprendedor envía la evidencia a revisión → pasa de DRAFT a SUBMITTED
  @Post(':id/submit')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.submit(id, userId);
  }

  // ─── GET /evidence/project/:projectId ────────────────────────────────────────
  // Todas las evidencias de un proyecto
  @Get('project/:projectId')
  @Roles(
    UserRole.ENTREPRENEUR,
    UserRole.MENTOR,
    UserRole.EVALUATOR,
    UserRole.ADMIN,
  )
  findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.service.findAllByProject(projectId);
  }

  // ─── GET /evidence/micro-action-instance/:instanceId ─────────────────────────
  // Todas las evidencias de una microacción específica
  @Get('micro-action-instance/:instanceId')
  @Roles(
    UserRole.ENTREPRENEUR,
    UserRole.MENTOR,
    UserRole.EVALUATOR,
    UserRole.ADMIN,
  )
  findAllByMicroActionInstance(
    @Param('instanceId', ParseUUIDPipe) instanceId: string,
  ) {
    return this.service.findAllByMicroActionInstance(instanceId);
  }

  // ─── GET /evidence/:id/versions ──────────────────────────────────────────────
  // Historial completo de versiones de una evidencia
  @Get(':id/versions')
  @Roles(
    UserRole.ENTREPRENEUR,
    UserRole.MENTOR,
    UserRole.EVALUATOR,
    UserRole.ADMIN,
  )
  findVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findVersions(id);
  }

  // ─── GET /evidence/:id ───────────────────────────────────────────────────────
  @Get(':id')
  @Roles(
    UserRole.ENTREPRENEUR,
    UserRole.MENTOR,
    UserRole.EVALUATOR,
    UserRole.ADMIN,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ─── PATCH /evidence/:id ─────────────────────────────────────────────────────
  // Actualiza descripción, privacidad o publicSignalEnabled
  // Solo permitido en estado DRAFT o REJECTED
  @Patch(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEvidenceDto,
  ) {
    return this.service.update(id, userId, dto);
  }

  // ─── DELETE /evidence/:id ─────────────────────────────────────────────────────
  // Solo se puede eliminar si está en DRAFT
  // También elimina el archivo de Google Drive si existe
  @Delete(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.remove(id, userId);
  }
}