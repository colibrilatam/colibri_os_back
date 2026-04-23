// src/reputation/reputation.controller.ts

import {
  Controller, Get, Post, Body, Param,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReputationService } from './reputation.service';
import { CreateAlgorithmVersionDto } from './dto/create-algorithm-version.dto';
import { CalculateSnapshotDto } from './dto/calculate-snapshot.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Reputation')
@ApiBearerAuth()
@Controller('reputation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  // ─── ALGORITMO ────────────────────────────────────────────────────────────────

  @Post('algorithm-versions')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear versión del algoritmo del IC',
    description: 'Solo ADMIN. Si `isActive = true`, desactiva la versión anterior automáticamente.',
  })
  @ApiResponse({ status: 201, description: 'Versión del algoritmo creada.' })
  @ApiResponse({ status: 400, description: 'Ya existe una versión con ese código.' })
  createAlgorithmVersion(@Body() dto: CreateAlgorithmVersionDto) {
    return this.reputationService.createAlgorithmVersion(dto);
  }

  @Get('algorithm-versions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todas las versiones del algoritmo' })
  @ApiResponse({ status: 200, description: 'Lista de versiones del algoritmo.' })
  findAllAlgorithmVersions() {
    return this.reputationService.findAllAlgorithmVersions();
  }

  @Get('algorithm-versions/active')
  @Roles(UserRole.ADMIN, UserRole.EVALUATOR, UserRole.MENTOR)
  @ApiOperation({ summary: 'Obtener la versión activa del algoritmo' })
  @ApiResponse({ status: 200, description: 'Versión activa del algoritmo.' })
  @ApiResponse({ status: 404, description: 'No hay versión activa.' })
  findActiveAlgorithm() {
    return this.reputationService.findActiveAlgorithm();
  }

  @Get('algorithm-versions/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener una versión del algoritmo por ID' })
  @ApiParam({ name: 'id', example: 'algo-uuid-001' })
  @ApiResponse({ status: 200, description: 'Versión del algoritmo.' })
  @ApiResponse({ status: 404, description: 'Versión no encontrada.' })
  findOneAlgorithmVersion(@Param('id', ParseUUIDPipe) id: string) {
    return this.reputationService.findOneAlgorithmVersion(id);
  }

  // ─── MOTOR DE CÁLCULO ─────────────────────────────────────────────────────────

  @Post('calculate')
  @Roles(UserRole.ADMIN, UserRole.EVALUATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular el Índice Colibrí de un proyecto',
    description: `Ejecuta el motor de cálculo del IC sobre el proyecto indicado usando la versión activa del algoritmo.

Calcula cinco dimensiones:
- **Acción**: % de microacciones completadas
- **Evidencia**: % de evidencias aprobadas sobre las enviadas  
- **Constancia**: % de microacciones completadas a tiempo
- **Colaboración**: señal base (se enriquece con Grupo 5)
- **Sostenibilidad**: señal base (se enriquece con Grupo 5)

Cierra el snapshot anterior del proyecto y persiste el nuevo con sus explicaciones granulares.`,
  })
  @ApiResponse({ status: 200, description: 'Snapshot calculado y persistido.' })
  @ApiResponse({ status: 404, description: 'Proyecto o algoritmo activo no encontrado.' })
  calculateSnapshot(@Body() dto: CalculateSnapshotDto) {
    return this.reputationService.calculateSnapshot(dto);
  }

  // ─── SNAPSHOTS ────────────────────────────────────────────────────────────────

  @Get('projects/:projectId/latest')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN, UserRole.MECENAS_SEMILLA, UserRole.MECENAS_FUNDACIONAL, UserRole.MECENAS_CAMBIO)
  @ApiOperation({
    summary: 'Obtener el snapshot reputacional vigente de un proyecto',
    description: 'Devuelve el snapshot con `validTo = null`, es decir el estado reputacional actual del proyecto. Es el dato que alimenta el panel del R-Lab.',
  })
  @ApiParam({ name: 'projectId', example: 'proj-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Snapshot vigente con explicaciones.' })
  @ApiResponse({ status: 404, description: 'No hay snapshot para este proyecto.' })
  findLatestSnapshot(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.reputationService.findLatestSnapshot(projectId);
  }

  @Get('projects/:projectId/history')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN, UserRole.MECENAS_SEMILLA, UserRole.MECENAS_FUNDACIONAL, UserRole.MECENAS_CAMBIO)
  @ApiOperation({
    summary: 'Historial de snapshots de un proyecto',
    description: 'Devuelve todos los snapshots calculados para el proyecto, ordenados del más reciente al más antiguo. Útil para ver la evolución del IC en el tiempo.',
  })
  @ApiParam({ name: 'projectId', example: 'proj-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Historial de snapshots.' })
  findSnapshotHistory(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.reputationService.findSnapshotHistory(projectId);
  }

  @Get('snapshots/:id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN, UserRole.MECENAS_SEMILLA, UserRole.MECENAS_FUNDACIONAL, UserRole.MECENAS_CAMBIO)
  @ApiOperation({
    summary: 'Obtener un snapshot con todas sus explicaciones',
    description: 'Devuelve el snapshot completo con el desglose granular de qué contribuyó al resultado. Es la vista de auditoría del IC.',
  })
  @ApiParam({ name: 'id', example: 'snap-uuid-001' })
  @ApiResponse({ status: 200, description: 'Snapshot con explicaciones granulares.' })
  @ApiResponse({ status: 404, description: 'Snapshot no encontrado.' })
  findSnapshotWithExplanations(@Param('id', ParseUUIDPipe) id: string) {
    return this.reputationService.findSnapshotWithExplanations(id);
  }
}