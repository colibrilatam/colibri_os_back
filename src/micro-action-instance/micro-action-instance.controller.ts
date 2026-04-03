// src/micro-action-instance/micro-action-instance.controller.ts

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
import { MicroActionInstanceService } from './micro-action-instance.service';
import { CreateMicroActionInstanceDto } from './dto/create-micro-action-instance.dto';
import { UpdateMicroActionInstanceDto } from './dto/update-micro-action-instance.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('micro-action-instances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MicroActionInstanceController {
  constructor(
    private readonly service: MicroActionInstanceService,
  ) {}

  // ─── POST /micro-action-instances ────────────────────────────────────────────
  // El emprendedor crea una instancia cuando inicia una microacción
  @Post()
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMicroActionInstanceDto,
  ) {
    return this.service.create(userId, dto);
  }

  // ─── GET /micro-action-instances/project/:projectId ──────────────────────────
  // Obtiene todas las instancias de microacción de un proyecto
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

  // ─── GET /micro-action-instances/me ──────────────────────────────────────────
  // El emprendedor consulta todas sus propias instancias
  @Get('me')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  findMyInstances(@CurrentUser('id') userId: string) {
    return this.service.findAllByUser(userId);
  }

  // ─── GET /micro-action-instances/:id ─────────────────────────────────────────
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

  // ─── PATCH /micro-action-instances/:id ───────────────────────────────────────
  // Actualiza estado o notas. La transición de estados está validada en el service
  @Patch(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMicroActionInstanceDto,
  ) {
    return this.service.update(id, userId, dto);
  }

  // ─── POST /micro-action-instances/:id/submit ─────────────────────────────────
  // Acción explícita de envío: pasa a estado "submitted"
  @Post(':id/submit')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.submit(id, userId);
  }

  // ─── POST /micro-action-instances/:id/reopen ─────────────────────────────────
  // Reabre una instancia (incrementa reopenedCount y attemptNumber)
  @Post(':id/reopen')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.reopen(id, userId);
  }

  // ─── DELETE /micro-action-instances/:id ──────────────────────────────────────
  // Solo se puede eliminar si está en started o in_progress
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