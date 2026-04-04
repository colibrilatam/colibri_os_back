import { PartialType } from '@nestjs/swagger';
import { CreateGoogleDriveDto } from './create-google-drive.dto';

export class UpdateGoogleDriveDto extends PartialType(CreateGoogleDriveDto) {}
