import { IsEnum, IsString } from 'class-validator';
import { UserRole, Gender } from '../../users/entities/user.entity';

export class CompleteProfileDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  tempToken: string;
}