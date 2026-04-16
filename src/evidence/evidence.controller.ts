import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam,
  ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
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

const EXAMPLE_EVIDENCE = {
  id: 'ev-uuid-0001',
  microActionInstanceId: 'mai-uuid-0001',
  authorUserId: 'user-uuid-001',
  projectId: 'proj-uuid-0001',
  evidenceType: 'file',
  status: 'draft',
  validationStatus: 'pending',
  isValidForIc: false,
  privacyLevel: 'private',
  description: 'Documento con hallazgos de entrevistas.',
  canonicalUri: 'https://res.cloudinary.com/colibri/raw/upload/v1/evidences/archivo.pdf',
  publicSignalEnabled: false,
  submittedAt: null,
  approvedAt: null,
  rejectedAt: null,
  createdAt: '2024-04-01T10:00:00.000Z',
  updatedAt: '2024-04-01T10:00:00.000Z',
};

@ApiTags('Evidence')
@ApiBearerAuth()
@Controller('evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  // ─── POST /evidence ───────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una evidencia',
    description: 'Crea el registro de evidencia en estado `draft`. Para evidencias de tipo FILE/IMAGE/VIDEO, usar luego `request-upload-signature` y `confirm-upload`. Para TEXT o LINK, se puede pasar `canonicalUri` directamente.',
  })
  @ApiBody({ type: CreateEvidenceDto })
  @ApiResponse({ status: 201, description: 'Evidencia creada en estado `draft`.', schema: { example: EXAMPLE_EVIDENCE } })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateEvidenceDto) {
    return this.service.create(userId, dto);
  }

  // ─── POST /evidence/request-upload-signature ──────────────────────────────

  @Post('request-upload-signature')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 1 — Solicitar firma para subir archivo a Cloudinary',
    description: `El backend genera una firma temporal para que el frontend suba el archivo **directamente a Cloudinary** sin pasar por el servidor.

**Flujo completo de upload:**
1. \`POST /evidence\` → crear el registro
2. \`POST /evidence/request-upload-signature\` → obtener firma
3. El frontend sube el archivo a Cloudinary usando la firma
4. \`POST /evidence/confirm-upload\` → confirmar y registrar la URL`,
  })
  @ApiBody({ type: RequestUploadSignatureDto })
  @ApiResponse({
    status: 200,
    description: 'Firma generada. Usar estos datos para el upload a Cloudinary.',
    schema: {
      example: {
        signature: 'abc123def456',
        timestamp: 1712000000,
        apiKey: '123456789012345',
        cloudName: 'colibri',
        folder: 'colibri/evidences/ev-uuid-0001',
        publicId: 'colibri/evidences/ev-uuid-0001/archivo',
      },
    },
  })
  requestUploadSignature(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestUploadSignatureDto,
  ) {
    return this.service.requestUploadSignature(userId, dto);
  }

  // ─── POST /evidence/confirm-upload ───────────────────────────────────────

  @Post('confirm-upload')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 2 — Confirmar que el archivo fue subido a Cloudinary',
    description: 'El frontend avisa que el upload a Cloudinary completó. El backend verifica, registra la URL en la evidencia y crea una `EvidenceVersion`.',
  })
  @ApiBody({ type: ConfirmUploadDto })
  @ApiResponse({
    status: 200,
    description: 'Upload confirmado. La evidencia queda con `canonicalUri` actualizado.',
    schema: {
      example: {
        ...EXAMPLE_EVIDENCE,
        canonicalUri: 'https://res.cloudinary.com/colibri/raw/upload/v1/evidences/archivo.pdf',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Evidencia no encontrada.' })
  confirmUpload(@CurrentUser('id') userId: string, @Body() dto: ConfirmUploadDto) {
    return this.service.confirmUpload(userId, dto);
  }

  // ─── POST /evidence/:id/submit ────────────────────────────────────────────

  @Post(':id/submit')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar evidencia a revisión',
    description: 'Mueve la evidencia de `draft` a `submitted`. Después de esto ya no se puede editar hasta recibir el resultado de la evaluación.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la evidencia a enviar', example: 'ev-uuid-0001' })
  @ApiResponse({
    status: 200,
    description: 'Evidencia enviada a revisión. Estado resultante: `submitted`.',
    schema: { example: { ...EXAMPLE_EVIDENCE, status: 'submitted', submittedAt: '2024-04-03T14:30:00.000Z' } },
  })
  @ApiResponse({ status: 400, description: 'La evidencia no está en estado `draft`.' })
  @ApiResponse({ status: 403, description: 'No sos el autor de esta evidencia.' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.submit(id, userId);
  }

  // ─── GET /evidence/project/:projectId ────────────────────────────────────

  @Get('project/:projectId')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar evidencias de un proyecto', description: 'Devuelve todas las evidencias asociadas al proyecto.' })
  @ApiParam({ name: 'projectId', description: 'UUID del proyecto', example: 'proj-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Lista de evidencias del proyecto.', schema: { example: [EXAMPLE_EVIDENCE] } })
  findAllByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.service.findAllByProject(projectId);
  }

  // ─── GET /evidence/micro-action-instance/:instanceId ─────────────────────

  @Get('micro-action-instance/:instanceId')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar evidencias de una instancia de microacción', description: 'Devuelve todas las evidencias vinculadas a una microacción instanciada específica.' })
  @ApiParam({ name: 'instanceId', description: 'UUID de la instancia de microacción', example: 'mai-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Lista de evidencias de la instancia.', schema: { example: [EXAMPLE_EVIDENCE] } })
  findAllByMicroActionInstance(@Param('instanceId', ParseUUIDPipe) instanceId: string) {
    return this.service.findAllByMicroActionInstance(instanceId);
  }

  // ─── GET /evidence/:id/versions ──────────────────────────────────────────

  @Get(':id/versions')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Historial de versiones de una evidencia', description: 'Devuelve todas las versiones de archivo de una evidencia, ordenadas cronológicamente.' })
  @ApiParam({ name: 'id', description: 'UUID de la evidencia', example: 'ev-uuid-0001' })
  @ApiResponse({
    status: 200,
    description: 'Versiones de la evidencia.',
    schema: {
      example: [{
        id: 'ev-ver-uuid-001', versionNumber: 1,
        storageUri: 'https://res.cloudinary.com/colibri/raw/upload/v1/evidences/archivo.pdf',
        isMaterialChange: false, changeSummary: null, createdAt: '2024-04-01T10:00:00.000Z',
      }],
    },
  })
  findVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findVersions(id);
  }

  // ─── GET /evidence/:id ───────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener una evidencia por ID', description: 'Devuelve el detalle completo de la evidencia con sus versiones y evaluaciones.' })
  @ApiParam({ name: 'id', description: 'UUID de la evidencia', example: 'ev-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Detalle de la evidencia.', schema: { example: EXAMPLE_EVIDENCE } })
  @ApiResponse({ status: 404, description: 'Evidencia no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ─── PATCH /evidence/:id ─────────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar una evidencia', description: 'Permite actualizar descripción, privacidad y señal pública. Solo disponible cuando la evidencia está en `draft`.' })
  @ApiParam({ name: 'id', description: 'UUID de la evidencia', example: 'ev-uuid-0001' })
  @ApiBody({ type: UpdateEvidenceDto })
  @ApiResponse({ status: 200, description: 'Evidencia actualizada.' })
  @ApiResponse({ status: 403, description: 'No sos el autor.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEvidenceDto,
  ) {
    return this.service.update(id, userId, dto);
  }

  // ─── DELETE /evidence/:id ─────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una evidencia', description: 'Solo disponible en estado `draft`. Una vez enviada no se puede eliminar.' })
  @ApiParam({ name: 'id', description: 'UUID de la evidencia', example: 'ev-uuid-0001' })
  @ApiResponse({ status: 204, description: 'Evidencia eliminada.' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar una evidencia en estado no-draft.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.remove(id, userId);
  }
}