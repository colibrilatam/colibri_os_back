// src/curriculum/dto/update-tramo.dto.ts
import { PartialType } from '@nestjs/swagger'; // ← @nestjs/swagger, no @nestjs/mapped-types
import { CreateTramoDto } from './create-tramo.dto';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class UpdateTramoDto extends PartialType(CreateTramoDto) {}