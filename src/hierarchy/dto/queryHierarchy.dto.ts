import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryHierarchyDto {
  @ApiPropertyOptional({
    description:
      'UUID del tramo. Si se provee, la respuesta incluye únicamente ese tramo y su subárbol (categorías, PACs, micro acciones y recursos). Si se omite, se retorna la jerarquía completa de todos los tramos.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  tramoId?: string;

  @ApiPropertyOptional({
    description: [
      'Filtra nodos inactivos en **todos** los niveles del árbol simultáneamente.',
      '',
      '- `true` (default): solo devuelve nodos con `is_active = true` en categories, PACs y',
      '  learning_resources. También excluye micro_action_definitions con `valid_to` vencido.',
      '  Recomendado para vistas de usuario final.',
      '- `false`: devuelve todos los nodos sin importar su estado activo/inactivo.',
      '  Útil para paneles de administración o auditoría del recorrido.',
    ].join('\n'),
    example: true,
    default: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  onlyActive?: boolean = true;

  @ApiPropertyOptional({
    description: [
      'Incluye o excluye los nodos de `learning_resource` dentro del árbol.',
      '',
      '- `true` (default): el árbol incluye los recursos pedagógicos a nivel PAC (sin micro',
      '  acción asociada) y los vinculados a cada `micro_action_definition`.',
      '- `false`: se retorna únicamente la estructura `tramo → category → pac → micro_actions`.',
      '  Los campos `learning_resources` siguen presentes pero como `[]`.',
      '  Útil para navegación, selectores o cuando el cliente cachea los recursos por separado.',
    ].join('\n'),
    example: true,
    default: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  includeResources?: boolean = true;
}