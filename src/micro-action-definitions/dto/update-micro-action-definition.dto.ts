// src/micro-action-definitions/dto/update-micro-action-definition.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateMicroActionDefinitionDto } from './create-micro-action-definition.dto';

export class UpdateMicroActionDefinitionDto extends PartialType(
  CreateMicroActionDefinitionDto,
) {}