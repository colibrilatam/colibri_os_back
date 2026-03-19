import { PartialType } from '@nestjs/swagger';
import { CreateCurriculumDto } from './create-curriculum.dto';

export class UpdateCurriculumDto extends PartialType(CreateCurriculumDto) {}
