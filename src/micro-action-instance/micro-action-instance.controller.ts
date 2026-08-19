// src/micro-action-instance/micro-action-instance.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { MicroActionInstanceService } from './micro-action-instance.service';
import { CreateMicroActionInstanceDto } from './dto/create-micro-action-instance.dto';
import { UpdateMicroActionInstanceDto } from './dto/update-micro-action-instance.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { ResolveVersionDto } from './dto/resolve-version.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { MicroActionInstanceStatus } from '../micro-action-instance/entities/micro-action-instance.entity';

@ApiTags('Micro Action Instances')
@ApiBearerAuth()
@Controller('micro-action-instances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MicroActionInstanceController {
  constructor(private readonly service: MicroActionInstanceService) {}

  // ─── POST /micro-action-instances ────────────────────────────────────────

  @Post()
  // @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una microacción',
    description:
      'El emprendedor crea una instancia cuando comienza a ejecutar una microacción. El estado inicial siempre es `pending`.',
  })
  @ApiBody({ type: CreateMicroActionInstanceDto })
  @ApiResponse({
    status: 201,
    description: 'Instancia creada en estado `pending`.',
    schema: {
      example: {
        id: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
        actorUserId: 'user-uuid-001',
        projectId: 'a3f1c2d4-1234-4abc-9def-000011112222',
        microActionDefinitionId: 'b7e2d3f5-5678-4bcd-aef0-333344445555',
        status: 'pending',
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
    @CurrentUser() principal: { sub: string; role: UserRole },
    @Body() dto: CreateMicroActionInstanceDto,
  ) {
    return this.service.create({ userId: principal.sub, role: principal.role }, dto);
  }

  // ─── GET /micro-action-instances/project/:projectId ──────────────────────

  @Get('project/:projectId')
  // @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
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
          status: 'completed',
          attemptNumber: 1,
          reopenedCount: 0,
          startedAt: '2024-04-01T10:00:00.000Z',
          submittedAt: null,
          validatedAt: null,
          completedAt: '2024-04-03T14:30:00.000Z',
          closedAt: null,
          isOnTime: true,
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
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    return this.service.findAllByProject(projectId, {
      userId: principal.sub,
      role: principal.role,
    });
  }

  // ─── GET /micro-action-instances/me ──────────────────────────────────────

  @Get('me')
  // @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
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
          status: 'pending',
          attemptNumber: 1,
          executionNotes: null,
        },
      ],
    },
  })
  findMyInstances(@CurrentUser('sub') userId: string) {
    return this.service.findAllByUser(userId);
  }

  // ─── GET /micro-action-instances/all ────────────────────────────────────

  @Get('all')
  // Sin @Roles: cualquier usuario autenticado puede consultar
  @ApiOperation({
    summary: 'Listar todas las instancias de todos los proyectos',
    description:
      'Devuelve todas las instancias con paginación y filtro de estado opcionales.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (por defecto 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de instancias por página (por defecto 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MicroActionInstanceStatus,
    description: 'Filtrar por estado (pending, submitted, completed)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de instancias.',
    schema: {
      example: {
        data: [
          {
            id: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
            projectId: 'a3f1c2d4-1234-4abc-9def-000011112222',
            status: 'pending',
            attemptNumber: 1,
          },
        ],
        total: 42,
        page: 1,
        limit: 10,
      },
    },
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: MicroActionInstanceStatus,
  ) {
    return this.service.findAll(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      status,
    );
  }

  // ─── GET /micro-action-instances/:id/versions ────────────────────────────

  @Get(':id/versions')
  // @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Historial de versiones de una instancia de microacción',
    description:
      'Devuelve todas las versiones registradas de la instancia (creación, cambios de estado, actualizaciones de notas), ordenadas de la más reciente a la más antigua.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la instancia',
    example: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Versiones de la instancia.',
    schema: {
      example: [
        {
          id: 'mai-ver-uuid-002',
          versionNumber: 2,
          changeType: 'status_change',
          status: 'completed',
          previousStatus: 'pending',
          executionNotes: 'Realicé 5 entrevistas.',
          attemptNumber: 1,
          reopenedCount: 0,
          changeSummary: 'Cambio de estado: pending → completed',
          createdAt: '2024-04-03T14:30:00.000Z',
        },
        {
          id: 'mai-ver-uuid-001',
          versionNumber: 1,
          changeType: 'created',
          status: 'pending',
          previousStatus: null,
          executionNotes: null,
          attemptNumber: 1,
          reopenedCount: 0,
          changeSummary: 'Instancia creada',
          createdAt: '2024-04-01T10:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Instancia no encontrada.' })
  findVersions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    return this.service.findVersions(id, { userId: principal.sub, role: principal.role });
  }

  // ─── POST /micro-action-instances/:id/versions ─────────────────────────────

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Crear una versión con archivo',
    description:
      'Sube un archivo a Cloudinary y crea un registro de versión con changeType `submitted`. El versionNumber se calcula automáticamente (1 si no existe versión previa, sino incrementa en 1).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la instancia de microacción',
    example: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Archivo a subir' },
        executionNotes: {
          type: 'string',
          description: 'Notas de ejecución (opcional)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Versión creada correctamente.' })
  @ApiResponse({ status: 400, description: 'Archivo requerido o datos inválidos.' })
  @ApiResponse({ status: 403, description: 'No sos el dueño de esta instancia.' })
  @ApiResponse({ status: 404, description: 'Instancia no encontrada.' })
  createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
    @Body() dto: CreateVersionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.createVersion(
      id,
      { userId: principal.sub, role: principal.role },
      dto,
      file,
    );
  }

  // ─── PATCH /micro-action-instances/versions/:versionId ─────────────────────

  @Patch('versions/:versionId')
  @Roles(
    UserRole.EVALUATOR,
    UserRole.MECENAS_SEMILLA,
    UserRole.MECENAS_FUNDACIONAL,
    UserRole.MECENAS_CAMBIO,
  )
  @ApiOperation({
    summary: 'Resolver una versión (aprobar o rechazar)',
    description: `Solo accesible para evaluadores y mecenas.
- REJECTED: la versión queda marcada como rechazada y se actualiza el changeSummary.
- COMPLETED: la versión queda marcada como completada, se actualiza el changeSummary y la
  instancia de microacción asociada pasa a estado completed con validatedAt, closedAt y
  executionWindowDaysSnapshot (días transcurridos entre startedAt y ahora).`,
  })
  @ApiParam({
    name: 'versionId',
    description: 'UUID de la versión a resolver',
    example: 'mai-ver-uuid-003',
  })
  @ApiBody({ type: ResolveVersionDto })
  @ApiResponse({ status: 200, description: 'Versión resuelta correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos (status no permitido).' })
  @ApiResponse({ status: 403, description: 'Rol sin permiso para resolver versiones.' })
  @ApiResponse({ status: 404, description: 'Versión no encontrada.' })
  resolveVersion(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ResolveVersionDto,
  ) {
    return this.service.resolveVersion(versionId, dto);
  }

  // ─── GET /micro-action-instances/:id ─────────────────────────────────────

  @Get(':id')
  // @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener una instancia por ID',
    description:
      'Devuelve el detalle completo de una instancia, incluyendo evidencias y relaciones.',
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
        status: 'completed',
        attemptNumber: 1,
        reopenedCount: 0,
        executionNotes: 'Realicé 5 entrevistas con usuarios reales.',
        startedAt: '2024-04-01T10:00:00.000Z',
        submittedAt: null,
        validatedAt: null,
        completedAt: '2024-04-03T14:30:00.000Z',
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
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    return this.service.findOneAuthorized(id, { userId: principal.sub, role: principal.role });
  }

  // ─── PATCH /micro-action-instances/:id ───────────────────────────────────

  @Patch(':id')
  // @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Actualizar estado o notas de una instancia',
    description: `Permite avanzar el estado de la instancia o actualizar las notas de ejecución.

**Transiciones de estado válidas:**
| Estado actual | Puede ir a |
|---|---|
| pending | completed |
| completed | — (terminal) |`,
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
    @CurrentUser() principal: { sub: string; role: UserRole },
    @Body() dto: UpdateMicroActionInstanceDto,
  ) {
    return this.service.update(id, { userId: principal.sub, role: principal.role }, dto);
  }

  // ─── DELETE /micro-action-instances/:id ──────────────────────────────────

  @Delete(':id')
  // @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una instancia',
    description:
      'Solo se puede eliminar si la instancia está en estado `pending`. Una vez completada, no se puede borrar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la instancia a eliminar',
    example: 'c1d2e3f4-aaaa-4bbb-8ccc-ddddeeee0001',
  })
  @ApiResponse({ status: 204, description: 'Instancia eliminada correctamente.' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar: estado no permitido (completed).',
  })
  @ApiResponse({ status: 403, description: 'No sos el dueño de esta instancia.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    return this.service.remove(id, { userId: principal.sub, role: principal.role });
  }
}
