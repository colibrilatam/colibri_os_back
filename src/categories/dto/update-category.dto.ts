// src/categories/dto/update-category.dto.ts
import { PartialType } from '@nestjs/swagger'; // ← importante: usar @nestjs/swagger, no @nestjs/mapped-types
import { CreateCategoryDto } from './create-category.dto';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}