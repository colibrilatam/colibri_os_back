import { PartialType } from '@nestjs/swagger';
import { CreateNftProjectDto } from './create-nft-project.dto';

export class UpdateNftProjectDto extends PartialType(CreateNftProjectDto) {}