import { PartialType } from '@nestjs/swagger';
import { CreateReputationDto } from './create-reputation.dto';

export class UpdateReputationDto extends PartialType(CreateReputationDto) {}
