import { PartialType } from '@nestjs/swagger';
import { CreateDigitalCredentialDto } from './create-digital-credential.dto';

export class UpdateDigitalCredentialDto extends PartialType(CreateDigitalCredentialDto) {}
