import { PartialType } from '@nestjs/swagger';  // ← importante: swagger, no mapped-types
import { CreateMicroActionDefinitionDto } from './create-micro-action-definition.dto';

export class UpdateMicroActionDefinitionDto extends PartialType(
  CreateMicroActionDefinitionDto,
) {}