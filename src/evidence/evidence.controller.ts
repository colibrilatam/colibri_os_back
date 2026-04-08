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
import { RequestUploadSignatureDto } from './dto/request-upload-signature.dto';
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
  @Post()
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEvidenceDto,
  ) {
    return this.service.create(userId, dto);
  }

  // ─── POST /evidence/request-upload-signature ──────────────────────────────────
  // Paso 1: el backend genera la firma para que el frontend suba directo a Cloudinary
  // El frontend usa: signature, timestamp, apiKey, cloudName, folder, publicId
  @Post('request-upload-signature')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  requestUploadSignature(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestUploadSignatureDto,
  ) {
    return this.service.requestUploadSignature(userId, dto);
  }

  // ─── POST /evidence/confirm-upload ───────────────────────────────────────────
  // Paso 2: el frontend avisa que el archivo ya fue subido a Cloudinary
  // El backend verifica, guarda la URL y crea la EvidenceVersion
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