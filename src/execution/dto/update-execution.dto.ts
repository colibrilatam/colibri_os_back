import { PartialType } from '@nestjs/swagger';
import { CreateExecutionDto } from './create-execution.dto';

export class UpdateExecutionDto extends PartialType(CreateExecutionDto) {}
