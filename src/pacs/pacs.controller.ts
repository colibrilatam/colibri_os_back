import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, ParseUUIDPipe, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam,
  ApiQuery, ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
import { PacsService } from './pacs.service';
import { CreatePacDto } from './dto/create-pac.dto';
import { UpdatePacDto } from './dto/update-pac.dto';

const EXAMPLE_PAC = {
  id: 'pac-uuid-0001',
  categoryId: 'cat-uuid-0001',
  code: 'PAC-T1-001',
  title: 'Descubrimiento de usuario',
  objectiveLine: 'Validar la existencia del problema con usuarios reales.',
  description: 'El emprendedor realiza entrevistas y documenta hallazgos.',
  sortOrder: 1,
  executionWindowDays: 14,
  minimumCompletionThreshold: '80.00',
  icWeight: '15.50',
  closureRule: 'Requiere aprobación de las 3 microacciones obligatorias.',
  templateVersion: 'v1.2',
  isActive: true,
  validFrom: null,
  validTo: null,
  createdAt: '2024-04-01T00:00:00.000Z',
  updatedAt: '2024-04-01T00:00:00.000Z',
  category: { id: 'cat-uuid-0001', name: 'Validación de problema' },
};

@ApiTags('PACs')
@ApiBearerAuth()
@Controller('pacs')
export class PacsController {
  constructor(private readonly pacsService: PacsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un PAC',
    description: 'Crea un nuevo PAC dentro de una categoría. El `code` debe ser único en el sistema.',
  })
  @ApiBody({ type: CreatePacDto })
  @ApiResponse({ status: 201, description: 'PAC creado.', schema: { example: EXAMPLE_PAC } })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @ApiResponse({ status: 409, description: 'Ya existe un PAC con ese código.' })
  create(@Body() dto: CreatePacDto) {
    return this.pacsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar PACs',
    description: 'Devuelve todos los PACs ordenados por `sortOrder`. Si se pasa `categoryId`, filtra por esa categoría.',
  })
  @ApiQuery({ name: 'categoryId', required: false, description: 'UUID de la categoría para filtrar', example: 'cat-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Lista de PACs.', schema: { example: [EXAMPLE_PAC] } })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada (si se pasó categoryId).' })
  findAll(@Query('categoryId') categoryId?: string) {
    if (categoryId) return this.pacsService.findByCategory(categoryId);
    return this.pacsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un PAC por ID',
    description: 'Devuelve el detalle del PAC con su categoría, tramo y microacciones asociadas.',
  })
  @ApiParam({ name: 'id', description: 'UUID del PAC', example: 'pac-uuid-0001' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del PAC.',
    schema: {
      example: {
        ...EXAMPLE_PAC,
        category: {
          id: 'cat-uuid-0001',
          name: 'Validación de problema',
          tramo: { id: 'tramo-uuid-0001', name: 'Fase Fundacional', sortOrder: 1 },
        },
        microActionDefinitions: [
          { id: 'mad-uuid-001', code: 'MA-T1-P1-001', instruction: 'Realizá 5 entrevistas.' },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'PAC no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un PAC',
    description: 'Actualiza parcialmente un PAC. Si se cambia `code` o `categoryId`, se validan contra duplicados y existencia.',
  })
  @ApiParam({ name: 'id', description: 'UUID del PAC a actualizar', example: 'pac-uuid-0001' })
  @ApiBody({ type: UpdatePacDto })
  @ApiResponse({ status: 200, description: 'PAC actualizado.', schema: { example: EXAMPLE_PAC } })
  @ApiResponse({ status: 404, description: 'PAC o categoría no encontrada.' })
  @ApiResponse({ status: 409, description: 'El nuevo código ya está en uso.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePacDto) {
    return this.pacsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un PAC',
    description: '⚠️ Elimina el PAC permanentemente. Fallará si tiene microacciones asociadas por FK.',
  })
  @ApiParam({ name: 'id', description: 'UUID del PAC a eliminar', example: 'pac-uuid-0001' })
  @ApiResponse({ status: 204, description: 'PAC eliminado.' })
  @ApiResponse({ status: 404, description: 'PAC no encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacsService.remove(id);
  }
}