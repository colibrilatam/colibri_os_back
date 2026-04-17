// src/categories/categories.controller.ts
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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva categoría',
    description:
      'Crea una categoría curricular asociada a un Tramo. El código (`code`) debe ser único en todo el sistema. Se valida que el `tramoId` referenciado exista antes de persistir.',
  })
  @ApiCreatedResponse({
    description: 'Categoría creada exitosamente.',
  })
  @ApiConflictResponse({
    description: 'Ya existe una categoría con el mismo `code`.',
  })
  @ApiNotFoundResponse({
    description: 'El `tramoId` proporcionado no existe.',
  })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas las categorías',
    description:
      'Retorna todas las categorías ordenadas por `sortOrder` ascendente, con la relación `tramo` incluida. Si se provee `tramoId` como query param, filtra solo las categorías de ese tramo.',
  })
  @ApiQuery({
    name: 'tramoId',
    required: false,
    description: 'UUID del tramo para filtrar las categorías. Si se omite, retorna todas.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías obtenida exitosamente.',
  })
  @ApiNotFoundResponse({
    description: 'El `tramoId` proporcionado no existe (solo cuando se usa el filtro).',
  })
  findAll(@Query('tramoId') tramoId?: string) {
    if (tramoId) {
      return this.categoriesService.findByTramo(tramoId);
    }
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una categoría por ID',
    description:
      'Retorna una categoría específica con las relaciones `tramo` y `pacs` incluidas.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la categoría',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada exitosamente.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una categoría con el `id` proporcionado.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una categoría',
    description:
      'Actualiza parcialmente los campos de una categoría existente. Si se cambia `tramoId`, se valida que el nuevo tramo exista. Si se cambia `code`, se valida que no exista otro registro con ese código.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la categoría a actualizar',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada exitosamente.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una categoría con el `id` proporcionado, o el nuevo `tramoId` no existe.',
  })
  @ApiConflictResponse({
    description: 'El nuevo `code` ya está en uso por otra categoría.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una categoría',
    description:
      'Elimina una categoría del sistema. La operación es permanente. Verificar previamente que la categoría no tenga PACs asociados antes de eliminar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la categoría a eliminar',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiNoContentResponse({
    description: 'Categoría eliminada exitosamente. No retorna contenido.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una categoría con el `id` proporcionado.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}