import { PartialType } from '@nestjs/swagger';
import { CreatePacDto } from './create-pac.dto';

export class UpdatePacDto extends PartialType(CreatePacDto) {}
