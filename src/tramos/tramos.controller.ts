// src/curriculum/tramos.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TramosService } from './tramos.service';
import { CreateTramoDto } from './dto/create-tramo.dto';
import { UpdateTramoDto } from './dto/update-tramo.dto';
import { ChangeTramoDto } from './dto/change-tramo.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('tramos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TramosController {
  constructor(private readonly tramosService: TramosService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateTramoDto) {
    return this.tramosService.create(dto);
  }

  @Get()
  findAll() {
    return this.tramosService.findAll();
  }

  @Get('project/:projectId')
  findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.tramosService.findAllByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTramoDto,
  ) {
    return this.tramosService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramosService.remove(id);
  }

  // ─── Historial de tramos ─────────────────────────────────────────────────

  /**
   * POST /tramos/project/:projectId/change
   * Cambia el tramo activo de un proyecto y registra el historial.
   * Solo ADMIN por ahora; si el sistema lo dispara automáticamente
   * se puede ampliar a lógica interna sin pasar por este endpoint.
   */
  @Post('project/:projectId/change')
  @Roles(UserRole.ADMIN)
  changeTramo(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: ChangeTramoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tramosService.changeTramo(projectId, dto, userId);
  }

  /**
   * GET /tramos/project/:projectId/history
   * Devuelve el historial completo de tramos de un proyecto.
   */
  @Get('project/:projectId/history')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  getTramoHistory(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.tramosService.getTramoHistory(projectId);
  }
}