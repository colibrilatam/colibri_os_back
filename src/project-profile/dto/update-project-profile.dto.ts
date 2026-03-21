import { PartialType } from '@nestjs/swagger';
import { CreateProjectProfileDto } from './create-project-profile.dto';

export class UpdateProjectProfileDto extends PartialType(CreateProjectProfileDto) {}