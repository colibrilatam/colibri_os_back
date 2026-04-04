import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { HierarchyService } from "./hierarchy.service";
import { QueryHierarchyDto } from "./dto/queryHierarchy.dto";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('Hierarchy')
@Controller('hierarchy')
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) { }

  @Get()
  @ApiOperation({
    summary: 'Obtener la jerarquía completa de tramos, categorías, PACs, micro acciones y recursos',
  })
  async getFullHierarchy(@Query() query: QueryHierarchyDto) {
    return this.hierarchyService.getFullHierarchy(query);
  }

  @Get('shallow')
  @ApiOperation({
    summary: 'Obtener la jerarquía simplificada (tramos, categorías y PACs) sin micro acciones ni recursos',
  })
  async getShallowHierarchy() {
    return this.hierarchyService.getShallowHierarchy();
  }

}