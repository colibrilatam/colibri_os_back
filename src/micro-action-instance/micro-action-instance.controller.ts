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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MicroActionInstanceService } from './micro-action-instance.service';
import { CreateMicroActionInstanceDto } from './dto/create-micro-action-instance.dto';
import { UpdateMicroActionInstanceDto } from './dto/update-micro-action-instance.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Micro Action Instances')
@ApiBearerAuth()
@Controller('micro-action-instances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MicroActionInstanceController {
  constructor(private readonly service: MicroActionInstanceService) {}

  // ─── POST /micro-action-instances ────────────────────────────────────────

  @Post()
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar una microacción',
    description:
      'El emprendedor crea una instancia cuando comienza a ejecutar una microacción. El estado inicial siempre es `started`.',
  })
  @ApiBody({ type: CreateMicroActionInstanceDto })
  @ApiResponse({
    status: 201,
    description: 'Instancia creada en estado `started`.',
    schema: {
      example: {
        id: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
        actorUserId: 'user-uuid-001',
        projectId: 'a3f1c2d4-1234-4abc-9def-000011112222',
        microActionDefinitionId: 'b7e2d3f5-5678-4bcd-aef0-333344445555',
        status: 'started',
        attemptNumber: 1,
        reopenedCount: 0,
        executionWindowDaysSnapshot: 7,
        executionNotes: null,
        startedAt: '2024-04-01T10:00:00.000Z',
        submittedAt: null,
        validatedAt: null,
        completedAt: null,
        closedAt: null,
        isOnTime: null,
        createdAt: '2024-04-01T10:00:00.000Z',
        updatedAt: '2024-04-01T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos en el body.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos.' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMicroActionInstanceDto,
  ) {
    return this.service.create(userId, dto);
  }

  // ─── GET /micro-action-instances/project/:projectId ──────────────────────

  @Get('project/:projectId')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Listar todas las instancias de un proyecto',
    description: 'Devuelve todas las microacciones instanciadas para el proyecto indicado.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'UUID del proyecto',
    example: 'a3f1c2d4-1234-4abc-9def-000011112222',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de instancias ordenadas por fecha de creación descendente.',
    schema: {
      example: [
        {
          id: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
          actorUserId: 'user-uuid-001',
          projectId: 'a3f1c2d4-1234-4abc-9def-000011112222',
          microActionDefinitionId: 'b7e2d3f5-5678-4bcd-aef0-333344445555',
          status: 'submitted',
          attemptNumber: 1,
          reopenedCount: 0,
          startedAt: '2024-04-01T10:00:00.000Z',
          submittedAt: '2024-04-03T14:30:00.000Z',
          validatedAt: null,
          completedAt: null,
          closedAt: null,
          isOnTime: null,
          executionNotes: 'Realicé 5 entrevistas.',
          microActionDefinition: {
            id: 'b7e2d3f5-5678-4bcd-aef0-333344445555',
            code: 'MA-001',
            instruction: 'Realizá al menos 5 entrevistas de descubrimiento.',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.service.findAllByProject(projectId);
  }

  // ─── GET /micro-action-instances/me ──────────────────────────────────────

  @Get('me')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Listar mis propias instancias de microacción',
    description: 'El emprendedor autenticado consulta todas las instancias que le pertenecen.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de instancias del usuario autenticado.',
    schema: {
      example: [
        {
          id: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
          projectId: 'a3f1c2d4-1234-4abc-9def-000011112222',
          status: 'in_progress',
          attemptNumber: 1,
          executionNotes: null,
        },
      ],
    },
  })
  findMyInstances(@CurrentUser('id') userId: string) {
    return this.service.findAllByUser(userId);
  }

  // ─── GET /micro-action-instances/:id ─────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener una instancia por ID',
    description: 'Devuelve el detalle completo de una instancia, incluyendo evidencias y relaciones.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la instancia',
    example: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la instancia.',
    schema: {
      example: {
        id: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
        actorUserId: 'user-uuid-001',
        projectId: 'a3f1c2d4-1234-4abc-9def-000011112222',
        status: 'submitted',
        attemptNumber: 1,
        reopenedCount: 0,
        executionNotes: 'Realicé 5 entrevistas con usuarios reales.',
        startedAt: '2024-04-01T10:00:00.000Z',
        submittedAt: '2024-04-03T14:30:00.000Z',
        validatedAt: null,
        completedAt: null,
        closedAt: null,
        isOnTime: true,
        evidences: [
          {
            id: 'ev-uuid-001',
            status: 'submitted',
            fileUrl: 'https://s3.example.com/evidencia.pdf',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Instancia no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ─── PATCH /micro-action-instances/:id ───────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Actualizar estado o notas de una instancia',
    description: `Permite avanzar el estado de la instancia o actualizar las notas de ejecución.
    
**Transiciones de estado válidas:**
| Estado actual | Puede ir a |
|---|---|
| started | in_progress, submitted |
| in_progress | submitted |
| submitted | validated, reopened |
| validated | completed |
| completed | closed |
| reopened | in_progress, submitted |
| closed | — (terminal) |`,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la instancia a actualizar',
    example: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
  })
  @ApiBody({ type: UpdateMicroActionInstanceDto })
  @ApiResponse({ status: 200, description: 'Instancia actualizada correctamente.' })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida o datos incorrectos.' })
  @ApiResponse({ status: 403, description: 'No sos el dueño de esta instancia.' })
  @ApiResponse({ status: 404, description: 'Instancia no encontrada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMicroActionInstanceDto,
  ) {
    return this.service.update(id, userId, dto);
  }

  // ─── POST /micro-action-instances/:id/submit ─────────────────────────────

  @Post(':id/submit')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar instancia a evaluación',
    description:
      'Acción explícita que mueve la instancia al estado `submitted`. Válida desde `started`, `in_progress` o `reopened`.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la instancia a enviar',
    example: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Instancia enviada a revisión. Estado resultante: `submitted`.',
    schema: {
      example: {
        id: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
        status: 'submitted',
        submittedAt: '2024-04-03T14:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Transición inválida desde el estado actual.' })
  @ApiResponse({ status: 403, description: 'No sos el dueño de esta instancia.' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.submit(id, userId);
  }

  // ─── POST /micro-action-instances/:id/reopen ─────────────────────────────

  @Post(':id/reopen')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reabrir una instancia para corrección',
    description:
      'Reabre una instancia en estado `submitted`. Incrementa `reopenedCount` y `attemptNumber`. Nuevo estado: `reopened`.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la instancia a reabrir',
    example: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Instancia reabierta. Estado resultante: `reopened`.',
    schema: {
      example: {
        id: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
        status: 'reopened',
        reopenedCount: 1,
        attemptNumber: 2,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Solo se puede reabrir desde estado `submitted`.' })
  @ApiResponse({ status: 403, description: 'No sos el dueño de esta instancia.' })
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.reopen(id, userId);
  }

  // ─── DELETE /micro-action-instances/:id ──────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una instancia',
    description:
      'Solo se puede eliminar si la instancia está en estado `started` o `in_progress`. Una vez enviada, no se puede borrar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la instancia a eliminar',
    example: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
  })
  @ApiResponse({ status: 204, description: 'Instancia eliminada correctamente.' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar: estado no permitido (submitted, validated, etc.).',
  })
  @ApiResponse({ status: 403, description: 'No sos el dueño de esta instancia.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.remove(id, userId);
  }
}