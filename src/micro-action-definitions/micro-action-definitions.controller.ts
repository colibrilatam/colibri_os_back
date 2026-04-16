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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MicroActionDefinitionsService } from './micro-action-definitions.service';
import { CreateMicroActionDefinitionDto } from './dto/create-micro-action-definition.dto';
import { UpdateMicroActionDefinitionDto } from './dto/update-micro-action-definition.dto';

const EXAMPLE_MAD = {
  id: 'd1e2f3a4-aaaa-4bbb-8ccc-000011112222',
  pacId: 'a1b2c3d4-0001-4aaa-8bbb-ccccdddd0001',
  rubricId: 'f1e2d3c4-0002-4bbb-9ccc-eeeeffff0002',
  code: 'MA-T1-P1-001',
  instruction: 'Realizá al menos 5 entrevistas de descubrimiento con potenciales usuarios.',
  sortOrder: 1,
  executionWindowDays: 7,
  microActionType: 'interview',
  isRequired: true,
  isReusable: false,
  evidenceRequired: true,
  expectedEvidenceType: 'file',
  consistencyWeight: '0.33',
  collaborationWeight: '0.33',
  sustainabilityWeight: '0.34',
  validFrom: null,
  validTo: null,
  createdAt: '2024-04-01T00:00:00.000Z',
  updatedAt: '2024-04-01T00:00:00.000Z',
  pac: {
    id: 'a1b2c3d4-0001-4aaa-8bbb-ccccdddd0001',
    code: 'PAC-T1-001',
    name: 'Descubrimiento de usuario',
  },
};

@ApiTags('Micro Action Definitions')
@ApiBearerAuth()
@Controller('micro-action-definitions')
export class MicroActionDefinitionsController {
  constructor(
    private readonly madService: MicroActionDefinitionsService,
  ) {}

  // ─── POST /micro-action-definitions ────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Crear una definición de microacción',
    description:
      'Crea una nueva microacción dentro de un PAC. El `code` debe ser único en todo el sistema. El `sortOrder` determina el orden dentro del PAC.',
  })
  @ApiBody({ type: CreateMicroActionDefinitionDto })
  @ApiResponse({
    status: 201,
    description: 'Microacción creada correctamente.',
    schema: { example: EXAMPLE_MAD },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos en el body.' })
  @ApiResponse({ status: 404, description: 'PAC o Rúbrica no encontrada.' })
  @ApiResponse({ status: 409, description: 'Ya existe una microacción con ese código.' })
  create(@Body() dto: CreateMicroActionDefinitionDto) {
    return this.madService.create(dto);
  }

  // ─── GET /micro-action-definitions ─────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Listar microacciones',
    description:
      'Devuelve todas las microacciones ordenadas por `sortOrder`. Si se pasa `pacId` como query param, filtra solo las de ese PAC.',
  })
  @ApiQuery({
    name: 'pacId',
    required: false,
    description: 'UUID del PAC para filtrar sus microacciones',
    example: 'a1b2c3d4-0001-4aaa-8bbb-ccccdddd0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de microacciones.',
    schema: { example: [EXAMPLE_MAD] },
  })
  @ApiResponse({ status: 404, description: 'PAC no encontrado (si se pasó pacId).' })
  findAll(@Query('pacId') pacId?: string) {
    if (pacId) {
      return this.madService.findByPac(pacId);
    }
    return this.madService.findAll();
  }

  // ─── GET /micro-action-definitions/:id ─────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una microacción por ID',
    description:
      'Devuelve el detalle completo de una microacción, incluyendo su PAC, categoría y rúbrica asociada.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la microacción',
    example: 'd1e2f3a4-aaaa-4bbb-8ccc-000011112222',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la microacción.',
    schema: {
      example: {
        ...EXAMPLE_MAD,
        pac: {
          id: 'a1b2c3d4-0001-4aaa-8bbb-ccccdddd0001',
          code: 'PAC-T1-001',
          name: 'Descubrimiento de usuario',
          category: {
            id: 'cat-uuid-001',
            name: 'Validación de problema',
          },
        },
        rubric: {
          id: 'f1e2d3c4-0002-4bbb-9ccc-eeeeffff0002',
          name: 'Rúbrica de entrevistas',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Microacción no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.madService.findOne(id);
  }

  // ─── PATCH /micro-action-definitions/:id ───────────────────────────────────

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una microacción',
    description:
      'Actualiza parcialmente una microacción. Todos los campos son opcionales. Si se cambia el `code`, se valida que no exista duplicado. Si se cambia `pacId` o `rubricId`, se verifica que existan.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la microacción a actualizar',
    example: 'd1e2f3a4-aaaa-4bbb-8ccc-000011112222',
  })
  @ApiBody({ type: UpdateMicroActionDefinitionDto })
  @ApiResponse({
    status: 200,
    description: 'Microacción actualizada correctamente.',
    schema: { example: EXAMPLE_MAD },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Microacción, PAC o Rúbrica no encontrada.' })
  @ApiResponse({ status: 409, description: 'El nuevo código ya está en uso.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMicroActionDefinitionDto,
  ) {
    return this.madService.update(id, dto);
  }

  // ─── DELETE /micro-action-definitions/:id ──────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una microacción',
    description:
      'Elimina permanentemente una microacción. ⚠️ Si ya existen instancias (`MicroActionInstance`) asociadas, la BD rechazará la operación por FK.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la microacción a eliminar',
    example: 'd1e2f3a4-aaaa-4bbb-8ccc-000011112222',
  })
  @ApiResponse({ status: 204, description: 'Microacción eliminada correctamente.' })
  @ApiResponse({ status: 404, description: 'Microacción no encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.madService.remove(id);
  }
}