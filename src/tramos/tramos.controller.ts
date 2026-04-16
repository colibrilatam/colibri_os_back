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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TramosService } from './tramos.service';
import { CreateTramoDto } from './dto/create-tramo.dto';
import { UpdateTramoDto } from './dto/update-tramo.dto';
import { ChangeTramoDto } from './dto/change-tramo.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Tramos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido.' })
@Controller('tramos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TramosController {
  constructor(private readonly tramosService: TramosService) {}

  // ─── CRUD base ────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Crear un nuevo tramo',
    description:
      'Crea un tramo curricular en la Ruta de Vuelo. El `code` debe ser único. Solo accesible por ADMIN.',
  })
  @ApiCreatedResponse({ description: 'Tramo creado exitosamente.' })
  @ApiConflictResponse({ description: 'Ya existe un tramo con el mismo `code`.' })
  @ApiForbiddenResponse({ description: 'Se requiere rol ADMIN.' })
  create(@Body() dto: CreateTramoDto) {
    return this.tramosService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los tramos',
    description:
      'Retorna todos los tramos ordenados por `sortOrder` ascendente. Accesible por cualquier usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de tramos obtenida exitosamente.' })
  findAll() {
    return this.tramosService.findAll();
  }

  @Get('project/:projectId')
  @ApiOperation({
    summary: 'Listar tramos de un proyecto',
    description:
      'Retorna todos los tramos asociados a un proyecto específico, incluyendo el tramo activo actual.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'UUID del proyecto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Tramos del proyecto obtenidos exitosamente.' })
  @ApiNotFoundResponse({ description: 'No existe un proyecto con el `projectId` proporcionado.' })
  findAllByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.tramosService.findAllByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un tramo por ID',
    description: 'Retorna un tramo específico con sus categorías y configuración curricular completa.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tramo',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Tramo encontrado exitosamente.' })
  @ApiNotFoundResponse({ description: 'No existe un tramo con el `id` proporcionado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Actualizar un tramo',
    description:
      'Actualiza parcialmente los campos de un tramo existente. Si se cambia `code`, se valida unicidad. Solo accesible por ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tramo a actualizar',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Tramo actualizado exitosamente.' })
  @ApiNotFoundResponse({ description: 'No existe un tramo con el `id` proporcionado.' })
  @ApiConflictResponse({ description: 'El nuevo `code` ya está en uso por otro tramo.' })
  @ApiForbiddenResponse({ description: 'Se requiere rol ADMIN.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTramoDto,
  ) {
    return this.tramosService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un tramo',
    description:
      'Elimina un tramo del sistema de forma permanente. Verificar previamente que no tenga categorías o proyectos asociados. Solo accesible por ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tramo a eliminar',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiNoContentResponse({ description: 'Tramo eliminado exitosamente. No retorna contenido.' })
  @ApiNotFoundResponse({ description: 'No existe un tramo con el `id` proporcionado.' })
  @ApiForbiddenResponse({ description: 'Se requiere rol ADMIN.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramosService.remove(id);
  }

  // ─── Historial de tramos ──────────────────────────────────────────────────

  @Post('project/:projectId/change')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Cambiar el tramo activo de un proyecto',
    description:
      'Mueve un proyecto a un nuevo tramo, cierra el registro de historial anterior (seteando `leftAt` y calculando `daysInTramo`) y abre uno nuevo. Solo accesible por ADMIN.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'UUID del proyecto al que se le cambiará el tramo',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiCreatedResponse({ description: 'Tramo cambiado y registro de historial creado exitosamente.' })
  @ApiNotFoundResponse({ description: 'El proyecto o el nuevo tramo no existen.' })
  @ApiForbiddenResponse({ description: 'Se requiere rol ADMIN.' })
  changeTramo(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: ChangeTramoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tramosService.changeTramo(projectId, dto, userId);
  }

  @Get('project/:projectId/history')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener historial de tramos de un proyecto',
    description:
      'Retorna el historial completo de tramos por los que transitó un proyecto, ordenado cronológicamente. El registro con `leftAt: null` corresponde al tramo activo actual. Accesible por ENTREPRENEUR, MENTOR, EVALUATOR y ADMIN.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'UUID del proyecto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Historial de tramos obtenido exitosamente.' })
  @ApiNotFoundResponse({ description: 'No existe un proyecto con el `projectId` proporcionado.' })
  getTramoHistory(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.tramosService.getTramoHistory(projectId);
  }
}