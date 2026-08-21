import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class ChangeUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.SUSPENDED })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({
    description: 'Motivo auditable del cambio de estado',
    example: 'Incumplimiento de las normas de la comunidad.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}